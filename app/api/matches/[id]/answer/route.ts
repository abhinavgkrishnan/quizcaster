import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import { calculatePoints, isValidAnswerTime } from '@/lib/utils/scoring'
import { getGameState, updatePlayerScore, savePlayerAnswer } from '@/lib/redis/game-state'
import type { Tables } from '@/lib/database.types'
import type { PlayerAnswer } from '@/lib/redis/types'

type Question = Tables<'questions'>

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const body = await request.json()

    const {
      fid,
      question_id,
      question_number,
      answer,
      time_taken_ms
    } = body

    // Validate inputs (allow empty string for timeout)
    if (!fid || !question_id || !question_number || time_taken_ms === undefined) {
      console.error('[Answer API] Validation failed:', { fid, question_id, question_number, answer, time_taken_ms });
      return NextResponse.json(
        { error: 'Missing required fields', received: body },
        { status: 400 }
      )
    }

    // Allow empty answer for timeouts
    if (answer === undefined || answer === null) {
    }

    if (!isValidAnswerTime(time_taken_ms)) {
      return NextResponse.json(
        { error: 'Invalid answer time' },
        { status: 400 }
      )
    }

    // Get game state from Redis (fast!)
    const gameState = await getGameState(matchId)

    if (!gameState) {
      return NextResponse.json({ error: 'Game session not found' }, { status: 404 })
    }

    // Verify user is part of this game
    if (gameState.player1_fid !== fid && gameState.player2_fid !== fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get question to validate answer (cached or direct query)
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if answer is correct
    const isCorrect = answer === question.correct_answer

    // Calculate points
    const pointsEarned = isCorrect ? calculatePoints(time_taken_ms) : 0

    // Save answer to Redis (temporary storage)
    const answerData: PlayerAnswer = {
      question_id,
      question_number,
      answer,
      is_correct: isCorrect,
      time_taken_ms,
      points_earned: pointsEarned,
      timestamp: Date.now(),
    }

    await savePlayerAnswer(matchId, fid, answerData)

    // Update score in Redis
    const { playerScore, opponentScore } = await updatePlayerScore(
      matchId,
      fid,
      pointsEarned
    )

    return NextResponse.json({
      isCorrect,
      points: pointsEarned,
      playerScore,
      opponentScore,
      questionNum: question_number,
    })
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
