import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import { getGameState, getPlayerAnswers, markPlayerCompleted, deleteGameSession } from '@/lib/redis/game-state'
import type { TablesInsert } from '@/lib/database.types'

/**
 * POST /api/matches/[id]/complete-async
 * Mark player as completed in async match and sync from Redis to Postgres
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const body = await request.json()
    const { fid } = body

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    // Get game state from Redis
    const gameState = await getGameState(matchId)

    if (!gameState) {
      return NextResponse.json({ error: 'Game session not found in Redis' }, { status: 404 })
    }

    // Get match from Postgres
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const isPlayer1 = match.player1_fid === fid

    // Mark player as completed in Redis
    const { bothCompleted } = await markPlayerCompleted(matchId, fid)

    // Get player's answers from Redis
    const playerAnswers = await getPlayerAnswers(matchId, fid)
    const score = gameState.player1_fid === fid ? gameState.player1_score : gameState.player2_score

    // Save answers to Postgres
    const answersToInsert: TablesInsert<'match_answers'>[] = playerAnswers.map(a => ({
      match_id: matchId,
      fid,
      question_id: a.question_id,
      question_number: a.question_number,
      answer_given: a.answer,
      is_correct: a.is_correct,
      time_taken_ms: a.time_taken_ms,
      points_earned: a.points_earned,
      answered_at: new Date(a.timestamp).toISOString(),
    }))

    if (answersToInsert.length > 0) {
      await supabase.from('match_answers').insert(answersToInsert)
    }

    // Update match with completion timestamp and score
    const updateData: any = {}
    if (isPlayer1) {
      updateData.player1_score = score
      updateData.player1_completed_at = new Date().toISOString()
    } else {
      updateData.player2_score = score
      updateData.player2_completed_at = new Date().toISOString()
    }

    // If both players completed (this player just finished, other already done)
    if (bothCompleted) {
      // Get both players' answers from Redis to save to Postgres
      const player1Answers = await getPlayerAnswers(matchId, gameState.player1_fid)
      const player2Answers = await getPlayerAnswers(matchId, gameState.player2_fid)

      // Save opponent's answers to Postgres too (if they exist)
      const opponentFid = isPlayer1 ? gameState.player2_fid : gameState.player1_fid
      const opponentAnswers = await getPlayerAnswers(matchId, opponentFid)

      if (opponentAnswers.length > 0) {
        const opponentAnswersToInsert: TablesInsert<'match_answers'>[] = opponentAnswers.map(a => ({
          match_id: matchId,
          fid: opponentFid,
          question_id: a.question_id,
          question_number: a.question_number,
          answer_given: a.answer,
          is_correct: a.is_correct,
          time_taken_ms: a.time_taken_ms,
          points_earned: a.points_earned,
          answered_at: new Date(a.timestamp).toISOString(),
        }))
        await supabase.from('match_answers').insert(opponentAnswersToInsert)
      }

      // Determine winner from Redis scores
      let winnerFid: number | null = null
      if (gameState.player1_score > gameState.player2_score) {
        winnerFid = gameState.player1_fid
      } else if (gameState.player2_score > gameState.player1_score) {
        winnerFid = gameState.player2_fid
      }

      // Check for forfeits
      const totalQuestions = gameState.questions.length
      let forfeitedBy: number | null = null
      if (player1Answers.length < totalQuestions) {
        forfeitedBy = gameState.player1_fid
      } else if (player2Answers.length < totalQuestions) {
        forfeitedBy = gameState.player2_fid
      }

      updateData.status = 'completed'
      updateData.winner_fid = winnerFid
      updateData.completed_at = new Date().toISOString()
      updateData.forfeited_by = forfeitedBy
      updateData.player1_score = gameState.player1_score
      updateData.player2_score = gameState.player2_score

      // Update associated challenge status to 'completed'
      await supabase
        .from('async_challenges')
        .update({ status: 'completed' })
        .eq('match_id', matchId)

      // Send notification to challenger that opponent has completed
      const challengerFid = isPlayer1 ? match.player2_fid : match.player1_fid

      try {
        const { data: users } = await supabase
          .from('users')
          .select('fid, username, display_name, notification_token, notification_url, notifications_enabled')
          .in('fid', [fid, challengerFid])

        const challenger = users?.find(u => u.fid === challengerFid)
        const opponent = users?.find(u => u.fid === fid)

        if (challenger?.notifications_enabled && challenger.notification_token && challenger.notification_url) {
          const opponentName = opponent?.display_name || opponent?.username || 'Someone'

          await fetch(challenger.notification_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${challenger.notification_token}`
            },
            body: JSON.stringify({
              notificationId: crypto.randomUUID(),
              title: 'Challenge Complete!',
              body: `${opponentName} finished your challenge!`,
              targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?match=${matchId}`,
              tokens: [challenger.notification_token]
            })
          }).catch(err => {
            console.error('Failed to send notification:', err)
          })
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
      }
    }

    // Update match
    await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)

    // If both completed, cleanup Redis
    if (bothCompleted) {
      await deleteGameSession(matchId)
    }

    return NextResponse.json({
      success: true,
      completed: bothCompleted,
      score
    })
  } catch (error) {
    console.error('[Complete Async] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete match', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
