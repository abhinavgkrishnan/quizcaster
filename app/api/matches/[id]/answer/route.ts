import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { calculatePoints, isValidAnswerTime } from '@/lib/game/scoring'

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

    // Validate inputs
    if (!fid || !question_id || !question_number || !answer || time_taken_ms === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!isValidAnswerTime(time_taken_ms)) {
      return NextResponse.json(
        { error: 'Invalid answer time' },
        { status: 400 }
      )
    }

    // Get match to verify it exists and user is part of it
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select()
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.player1_fid !== fid && match.player2_fid !== fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get question to check correct answer
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select()
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if answer is correct
    const isCorrect = answer === question.correct_answer

    // Calculate points
    const pointsEarned = isCorrect ? calculatePoints(time_taken_ms) : 0

    // Insert answer record
    await supabase.from('match_answers').insert({
      match_id: matchId,
      fid,
      question_id: question_id,
      question_number: question_number,
      answer_given: answer,
      is_correct: isCorrect,
      time_taken_ms: time_taken_ms,
      points_earned: pointsEarned
    })

    // Update match score
    const isPlayer1 = match.player1_fid === fid
    let botPoints = 0

    // Generate bot response if playing against bot
    if (match.is_bot_opponent && isPlayer1) {
      // Bot randomly gets between 0-18 points (slightly easier than perfect player)
      const botAccuracy = Math.random() < 0.75 // 75% accuracy
      if (botAccuracy) {
        const botTime = Math.random() * 5000 + 1000 // 1-6 seconds
        botPoints = calculatePoints(botTime) * 0.9 // 90% of max points
        botPoints = Math.floor(botPoints)
      }
    }

    if (isPlayer1) {
      await supabase
        .from('matches')
        .update({
          player1_score: match.player1_score + pointsEarned,
          player2_score: match.player2_score + botPoints
        })
        .eq('id', matchId)
    } else {
      await supabase
        .from('matches')
        .update({
          player2_score: match.player2_score + pointsEarned
        })
        .eq('id', matchId)
    }

    // Get updated match for response
    const { data: updatedMatch } = await supabase
      .from('matches')
      .select()
      .eq('id', matchId)
      .single()

    return NextResponse.json({
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      points_earned: pointsEarned,
      player_score: isPlayer1 ? updatedMatch.player1_score : updatedMatch.player2_score,
      opponent_score: isPlayer1 ? updatedMatch.player2_score : updatedMatch.player1_score
    })
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
