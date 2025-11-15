import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import { getGameState, markPlayerCompleted, getPlayerAnswers, deleteGameSession } from '@/lib/redis/game-state'
import { broadcastGameComplete } from '@/lib/utils/realtime'
import { MATCH_STATUS } from '@/lib/constants'
import type { TablesInsert } from '@/lib/database.types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const body = await request.json()
    const { fid } = body

    if (!fid) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 })
    }

    // Get game state from Redis
    const gameState = await getGameState(matchId)

    if (!gameState) {
      return NextResponse.json({ error: 'Game session not found' }, { status: 404 })
    }

    // Verify user is part of this game
    if (gameState.player1_fid !== fid && gameState.player2_fid !== fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const isPlayer1 = gameState.player1_fid === fid

    // Mark player as completed in Redis
    const { bothCompleted } = await markPlayerCompleted(matchId, fid)

    // If both players completed, save everything to Postgres
    if (bothCompleted) {
      // Get all answers from Redis
      const player1Answers = await getPlayerAnswers(matchId, gameState.player1_fid)
      const player2Answers = await getPlayerAnswers(matchId, gameState.player2_fid)

      // Prepare batch insert for match_answers
      const allAnswers: TablesInsert<'match_answers'>[] = [
        ...player1Answers.map(a => ({
          match_id: matchId,
          fid: gameState.player1_fid,
          question_id: a.question_id,
          question_number: a.question_number,
          answer_given: a.answer,
          is_correct: a.is_correct,
          time_taken_ms: a.time_taken_ms,
          points_earned: a.points_earned,
          answered_at: new Date(a.timestamp).toISOString(),
        })),
        ...player2Answers.map(a => ({
          match_id: matchId,
          fid: gameState.player2_fid,
          question_id: a.question_id,
          question_number: a.question_number,
          answer_given: a.answer,
          is_correct: a.is_correct,
          time_taken_ms: a.time_taken_ms,
          points_earned: a.points_earned,
          answered_at: new Date(a.timestamp).toISOString(),
        })),
      ]

      // Batch insert all answers
      const { error: answersError } = await supabase
        .from('match_answers')
        .insert(allAnswers)

      if (answersError) {
        console.error('Error inserting answers:', answersError)
        // Continue anyway - we'll try to save what we can
      }

      // Check for forfeits
      const totalQuestions = gameState.questions.length
      const player1Forfeited = player1Answers.length < totalQuestions
      const player2Forfeited = player2Answers.length < totalQuestions

      let forfeitedBy: number | null = null
      if (player1Forfeited) {
        forfeitedBy = gameState.player1_fid
      } else if (player2Forfeited) {
        forfeitedBy = gameState.player2_fid
      }

      // Determine winner
      let winnerFid: number | null
      if (gameState.player1_score > gameState.player2_score) {
        winnerFid = gameState.player1_fid
      } else if (gameState.player2_score > gameState.player1_score) {
        winnerFid = gameState.player2_fid
      } else {
        winnerFid = null // draw
      }

      // Update match status (this triggers the stats aggregation function)
      await supabase.from('matches')
        .update({
          status: MATCH_STATUS.COMPLETED,
          completed_at: new Date().toISOString(),
          winner_fid: winnerFid,
          forfeited_by: forfeitedBy,
        })
        .eq('id', matchId)

      // Update associated challenge status to 'completed' (for async_challenge matches that became live)
      await supabase
        .from('async_challenges')
        .update({ status: 'completed' })
        .eq('match_id', matchId)

      // Broadcast game completion to both players
      const channel = supabase.channel(`game:${matchId}`)
      await broadcastGameComplete(channel, {
        winnerFid,
        scores: {
          p1: gameState.player1_score,
          p2: gameState.player2_score,
        },
      })

      // Cleanup Redis
      await deleteGameSession(matchId)

      // Determine result for this player
      let result: 'win' | 'loss' | 'draw'
      if (winnerFid === fid) {
        result = 'win'
      } else if (winnerFid === null) {
        result = 'draw'
      } else {
        result = 'loss'
      }

      return NextResponse.json({
        completed: true,
        result,
        playerScore: isPlayer1 ? gameState.player1_score : gameState.player2_score,
        opponentScore: isPlayer1 ? gameState.player2_score : gameState.player1_score,
        winnerFid,
      })
    }

    // Only this player completed, wait for opponent
    return NextResponse.json({
      completed: false,
      waiting_for_opponent: true,
      playerScore: isPlayer1 ? gameState.player1_score : gameState.player2_score,
      opponentScore: isPlayer1 ? gameState.player2_score : gameState.player1_score,
    })
  } catch (error) {
    console.error('Error completing match:', error)
    return NextResponse.json(
      { error: 'Failed to complete match' },
      { status: 500 }
    )
  }
}
