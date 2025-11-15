import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import { calculatePoints } from '@/lib/utils/scoring'
import { getGameState, updatePlayerScore, savePlayerAnswer } from '@/lib/redis/game-state'
import type { PlayerAnswer } from '@/lib/redis/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const body = await request.json()

    const { fid, question_id, question_number, answer, time_taken_ms } = body

    if (!fid || !question_id || question_number === undefined || time_taken_ms === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get question to check answer
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check correctness
    const isCorrect = answer === question.correct_answer
    const points = isCorrect ? calculatePoints(time_taken_ms) : 0

    // Save answer to Redis
    const answerData: PlayerAnswer = {
      question_id,
      question_number,
      answer,
      is_correct: isCorrect,
      time_taken_ms,
      points_earned: points,
      timestamp: Date.now(),
    }

    await savePlayerAnswer(matchId, fid, answerData)

    // Update player score in Redis
    const { playerScore, opponentScore, isPlayer1 } = await updatePlayerScore(
      matchId,
      fid,
      points
    )

    // In emulation mode, update opponent score with their recorded answer for this question
    const { data: match } = await supabase
      .from('matches')
      .select('match_type, player1_fid, player2_fid')
      .eq('id', matchId)
      .single()

    let finalOpponentScore = opponentScore

    if (match?.match_type === 'async_challenge') {
      // Get opponent's recorded answer for this question number
      const opponentFid = isPlayer1 ? match.player2_fid : match.player1_fid
      const { data: opponentAnswer } = await supabase
        .from('match_answers')
        .select('points_earned')
        .eq('match_id', matchId)
        .eq('fid', opponentFid)
        .eq('question_number', question_number)
        .single()

      if (opponentAnswer) {
        // Update opponent score in Redis with their recorded points for this question
        const { updatePlayerScore: updateScore } = await import('@/lib/redis/game-state')
        await updateScore(matchId, opponentFid, opponentAnswer.points_earned)
        finalOpponentScore = opponentScore + opponentAnswer.points_earned
      }
    }

    return NextResponse.json({
      isCorrect,
      points,
      playerScore,
      opponentScore: finalOpponentScore,
      questionNum: question_number,
      correct_answer: question.correct_answer
    })
  } catch (error) {
    console.error('[Answer Async] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save answer', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
