import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { shuffleArray } from '@/lib/utils/shuffle'
import type { Tables } from '@/lib/database.types'

type Question = Pick<Tables<'questions'>, 'id' | 'topic' | 'question' | 'options' | 'image_url'>
type User = Tables<'users'>
type Match = Tables<'matches'>

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, topic, player_fid, opponent_fid, challenge_message } = body

    // Validate inputs
    if (!type || !topic || !player_fid) {
      return NextResponse.json(
        { error: 'Missing required fields: type, topic, player_fid' },
        { status: 400 }
      )
    }

    if (!['realtime', 'async', 'bot'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid match type. Must be: realtime, async, or bot' },
        { status: 400 }
      )
    }

    // Get 10 random questions for this topic
    const { data: questionResults, error: questionsError } = await supabase
      .from('questions')
      .select('id, topic, question, options, image_url')
      .eq('topic', topic)
      .eq('is_active', true)
      .limit(50) // Get more to filter and randomize

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    if (!questionResults || questionResults.length < 10) {
      return NextResponse.json(
        { error: `Not enough questions for topic: ${topic}` },
        { status: 404 }
      )
    }

    // Randomly select 10 questions
    const shuffledQuestions = shuffleArray(questionResults).slice(0, 10) as Question[]
    const questionIds = shuffledQuestions.map((q) => q.id)

    // Create match record
    const expiresAt = type === 'async'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        match_type: type,
        topic,
        player1_fid: player_fid,
        player2_fid: opponent_fid || null,
        is_bot_opponent: type === 'bot',
        status: type === 'bot' ? 'in_progress' : 'waiting',
        questions_used: questionIds,
        challenge_message: challenge_message || null,
        expires_at: expiresAt,
        started_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (matchError || !matchData) {
      console.error('Error creating match:', matchError)
      return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
    }

    // Get opponent data if provided
    let opponentData: User | null = null
    if (opponent_fid && type !== 'bot') {
      const { data: opponent } = await supabase
        .from('users')
        .select('*')
        .eq('fid', opponent_fid)
        .single()

      opponentData = opponent || null
    }

    // Parse options as string array
    const parseOptions = (options: unknown): string[] => {
      if (Array.isArray(options)) {
        return options.filter((opt): opt is string => typeof opt === 'string')
      }
      return []
    }

    // Return match data with questions (shuffle options, no correct answers)
    return NextResponse.json({
      match_id: matchData.id,
      match_type: type,
      topic,
      questions: shuffledQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        options: shuffleArray(parseOptions(q.options)),
        image_url: q.image_url
      })),
      opponent: opponentData,
      status: matchData.status
    })
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}
