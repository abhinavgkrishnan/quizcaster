import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * GET /api/matches/[id]/details
 * Get complete match details including answers for both players
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const fidNumber = parseInt(fid)

    // Get match data
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Get both players' answers
    const { data: answers, error: answersError } = await supabase
      .from('match_answers')
      .select('*')
      .eq('match_id', matchId)
      .order('question_number', { ascending: true })

    if (answersError) {
      console.error('Error fetching answers:', answersError)
    }

    // Get opponent data
    const opponentFid = match.player1_fid === fidNumber ? match.player2_fid : match.player1_fid
    const { data: opponent } = opponentFid ? await supabase
      .from('users')
      .select('fid, username, display_name, pfp_url')
      .eq('fid', opponentFid)
      .single() : { data: null }

    // Separate answers by player
    const myAnswers = answers?.filter(a => a.fid === fidNumber) || []
    const opponentAnswers = answers?.filter(a => a.fid === opponentFid) || []

    // Determine scores and result
    const isPlayer1 = match.player1_fid === fidNumber
    const myScore = isPlayer1 ? match.player1_score : match.player2_score
    const opponentScore = isPlayer1 ? match.player2_score : match.player1_score

    let result: 'win' | 'loss' | 'draw' = 'draw'
    if (match.winner_fid === fidNumber) {
      result = 'win'
    } else if (match.winner_fid !== null && match.winner_fid !== fidNumber) {
      result = 'loss'
    }

    return NextResponse.json({
      match_id: matchId,
      topic: match.topic,
      my_score: myScore,
      opponent_score: opponentScore,
      result,
      forfeited_by: match.forfeited_by,
      opponent: {
        fid: opponent?.fid,
        username: opponent?.username || 'Unknown',
        displayName: opponent?.display_name || 'Unknown',
        pfpUrl: opponent?.pfp_url
      },
      my_answers: myAnswers.map(a => ({
        isCorrect: a.is_correct,
        timeTaken: a.time_taken_ms,
        points: a.points_earned
      })),
      opponent_answers: opponentAnswers.map(a => ({
        isCorrect: a.is_correct,
        timeTaken: a.time_taken_ms,
        points: a.points_earned
      })),
      completed_at: match.completed_at
    })
  } catch (error) {
    console.error('Error fetching match details:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch match details',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
