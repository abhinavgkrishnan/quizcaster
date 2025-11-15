import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import { createGameSession } from '@/lib/redis/game-state'

/**
 * POST /api/matches/[id]/start
 * Initialize an async challenge match in Redis so the game can start
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

    // Get match from database
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Parse questions_used
    const questionIds = Array.isArray(match.questions_used)
      ? match.questions_used
      : JSON.parse(match.questions_used as string)

    if (!questionIds || questionIds.length === 0) {
      return NextResponse.json({ error: 'Match has no questions' }, { status: 400 })
    }

    // Create Redis game session for async match
    // For async challenges, we only have one player initially
    await createGameSession(
      matchId,
      match.player1_fid,
      match.player2_fid || 0, // Use 0 or dummy for async
      questionIds
    )

    // Update match status
    await supabase
      .from('matches')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', matchId)

    return NextResponse.json({ success: true, match_id: matchId })
  } catch (error) {
    console.error('[Match Start] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start match', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
