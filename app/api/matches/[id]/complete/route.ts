import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

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

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select()
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify user is part of this match
    if (match.player1_fid !== fid && match.player2_fid !== fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const isPlayer1 = match.player1_fid === fid

    // Determine if match is complete
    let matchStatus = match.status
    let matchCompletedAt = match.completedAt
    let winnerFid = match.winnerFid

    if (match.match_type === 'bot' || match.match_type === 'realtime') {
      // For bot/realtime, match completes when either player finishes
      matchStatus = 'completed'
      matchCompletedAt = new Date()

      // Determine winner
      if (match.player1_score > match.player2_score) {
        winnerFid = match.player1_fid
      } else if (match.player2_score > match.player1_score) {
        winnerFid = match.player2_fid
      } else {
        winnerFid = null // draw
      }
    } else if (match.match_type === 'async') {
      // For async, mark this player as completed
      if (isPlayer1) {
        await supabase
          .from('matches')
          .update({
            player1_completed_at: new Date().toISOString()
          })
          .eq('id', matchId)
      } else {
        // Player 2 just finished - match is now complete
        matchStatus = 'completed'
        matchCompletedAt = new Date()

        // Determine winner
        if (match.player1_score > match.player2_score) {
          winnerFid = match.player1_fid
        } else if (match.player2_score > match.player1_score) {
          winnerFid = match.player2_fid
        } else {
          winnerFid = null
        }
      }
    }

    // Update match
    await supabase
      .from('matches')
      .update({
        status: matchStatus,
        completed_at: matchCompletedAt?.toISOString(),
        winner_fid: winnerFid
      })
      .eq('id', matchId)

    // Determine result for this player
    let result: 'win' | 'loss' | 'draw'
    if (winnerFid === fid) {
      result = 'win'
    } else if (winnerFid === null) {
      result = 'draw'
    } else {
      result = 'loss'
    }

    const playerScore = isPlayer1 ? match.player1_score : match.player2_score
    const opponentScore = isPlayer1 ? match.player2_score : match.player1_score

    return NextResponse.json({
      result,
      player_score: playerScore,
      opponent_score: opponentScore,
      match_completed: matchStatus === 'completed',
      winner_fid: winnerFid
    })
  } catch (error) {
    console.error('Error completing match:', error)
    return NextResponse.json(
      { error: 'Failed to complete match' },
      { status: 500 }
    )
  }
}
