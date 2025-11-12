import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import type { Tables } from '@/lib/database.types'

type Match = Tables<'matches'>
type User = Tables<'users'>
type MatchAnswer = Tables<'match_answers'>

interface EmulationAnswer {
  question_number: number
  time_taken_ms: number
  is_correct: boolean
  points_earned: number
}

interface OpponentInfo {
  fid: number
  username: string
  display_name: string
  pfp_url: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Only allow emulation for async matches
    if (match.match_type !== 'async') {
      return NextResponse.json(
        { error: 'Emulation only available for async matches' },
        { status: 400 }
      )
    }

    // Get player 1's answers (the challenger)
    const { data: answersData } = await supabase
      .from('match_answers')
      .select('question_number, time_taken_ms, is_correct, points_earned')
      .eq('match_id', matchId)
      .eq('fid', match.player1_fid)
      .order('question_number')

    // Get opponent (player 1) data
    const { data: opponent, error: opponentError } = await supabase
      .from('users')
      .select('*')
      .eq('fid', match.player1_fid)
      .single()

    if (opponentError || !opponent) {
      return NextResponse.json(
        { error: 'Opponent data not found' },
        { status: 404 }
      )
    }

    const opponentInfo: OpponentInfo = {
      fid: opponent.fid,
      username: opponent.username,
      display_name: opponent.display_name,
      pfp_url: opponent.pfp_url
    }

    const answers: EmulationAnswer[] = (answersData || []).map((a) => ({
      question_number: a.question_number,
      time_taken_ms: a.time_taken_ms,
      is_correct: a.is_correct,
      points_earned: a.points_earned
    }))

    return NextResponse.json({
      opponent: opponentInfo,
      answers
    })
  } catch (error) {
    console.error('Error fetching emulation data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emulation data' },
      { status: 500 }
    )
  }
}
