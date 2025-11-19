import { NextRequest, NextResponse } from 'next/server'
import { completeMatchForPlayer } from '@/lib/utils/match-completion'

/**
 * POST /api/matches/[id]/complete-async
 * Mark player as completed in async match
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
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    // Use unified completion handler (handles async matches)
    const result = await completeMatchForPlayer({
      matchId,
      fid,
      isAsync: true
    })

    return NextResponse.json({
      success: true,
      completed: result.bothCompleted,
      score: result.playerScore
    })
  } catch (error) {
    console.error('[Complete Async] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete match', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
