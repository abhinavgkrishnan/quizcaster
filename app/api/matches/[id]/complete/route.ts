import { NextRequest, NextResponse } from 'next/server'
import { completeMatchForPlayer } from '@/lib/utils/match-completion'

/**
 * POST /api/matches/[id]/complete
 * Mark a player as completed for a live match
 * Uses unified completion handler for consistency
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
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 })
    }

    // Use unified completion handler (handles live matches)
    const result = await completeMatchForPlayer({
      matchId,
      fid,
      isAsync: false
    })

    return NextResponse.json({
      completed: result.bothCompleted,
      result: result.result,
      waiting_for_opponent: result.waitingForOpponent,
      playerScore: result.playerScore,
      opponentScore: result.opponentScore,
      winnerFid: result.winnerFid,
    })
  } catch (error) {
    console.error('[Complete] Error completing match:', error)
    return NextResponse.json(
      { error: 'Failed to complete match' },
      { status: 500 }
    )
  }
}
