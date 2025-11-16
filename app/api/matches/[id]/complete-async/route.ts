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

    // Get game state from Redis (might not exist if player1 already completed and session cleaned up)
    const gameState = await getGameState(matchId)

    let bothCompleted = false
    let playerAnswers: any[] = []
    let score = 0

    if (gameState) {
      // Redis session exists - use it
      const completionResult = await markPlayerCompleted(matchId, fid)
      bothCompleted = completionResult.bothCompleted
      playerAnswers = await getPlayerAnswers(matchId, fid)
      score = gameState.player1_fid === fid ? gameState.player1_score : gameState.player2_score
    } else {
      // No Redis session - calculate from Postgres
      console.log('[Complete Async] No Redis session, using Postgres data')
      const { data: answers } = await supabase
        .from('match_answers')
        .select('*')
        .eq('match_id', matchId)
        .eq('fid', fid)
        .order('question_number')

      playerAnswers = (answers || []).map(a => ({
        question_id: a.question_id,
        question_number: a.question_number,
        answer: a.answer_given,
        is_correct: a.is_correct,
        time_taken_ms: a.time_taken_ms,
        points_earned: a.points_earned,
        timestamp: new Date(a.answered_at).getTime()
      }))

      score = playerAnswers.reduce((sum, a) => sum + a.points_earned, 0)

      // Check if both players completed by checking Postgres
      const otherPlayerCompleted = isPlayer1 ? match.player2_completed_at : match.player1_completed_at
      bothCompleted = !!otherPlayerCompleted
    }

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
      if (gameState) {
        // Get both players' answers from Redis to save to Postgres
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
      }

      // Get both players' scores from Postgres (already saved from answers)
      const { data: allAnswers } = await supabase
        .from('match_answers')
        .select('fid, points_earned')
        .eq('match_id', matchId)

      const player1Score = allAnswers
        ?.filter(a => a.fid === match.player1_fid)
        .reduce((sum, a) => sum + a.points_earned, 0) || 0
      const player2Score = allAnswers
        ?.filter(a => a.fid === match.player2_fid)
        .reduce((sum, a) => sum + a.points_earned, 0) || 0

      // Determine winner
      let winnerFid: number | null = null
      if (player1Score > player2Score) {
        winnerFid = match.player1_fid
      } else if (player2Score > player1Score) {
        winnerFid = match.player2_fid
      }

      updateData.status = 'completed'
      updateData.winner_fid = winnerFid
      updateData.completed_at = new Date().toISOString()
      updateData.player1_score = player1Score
      updateData.player2_score = player2Score

      // Update associated challenge status to 'completed'
      const { error: challengeError } = await supabase
        .from('async_challenges')
        .update({ status: 'completed' })
        .eq('match_id', matchId)

      if (challengeError) {
        console.error('[Complete Async] Failed to update challenge status:', challengeError)
      } else {
        console.log('[Complete Async] Updated challenge status to completed for match:', matchId)
      }

      // Send notification to challenger that opponent has completed
      const challengerFid = isPlayer1 ? match.player2_fid : match.player1_fid

      try {
        const { TEXT } = await import('@/lib/constants/text')
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
              title: TEXT.CHALLENGE.NOTIF_COMPLETE_TITLE,
              body: TEXT.CHALLENGE.NOTIF_COMPLETE_BODY(opponentName),
              targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?screen=challenges`,
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
