import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import { createGameSession } from '@/lib/redis/game-state'

/**
 * POST /api/matches/[id]/start-async
 * Initialize Redis session for async match when player starts playing
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

    // Verify this is an async match
    if (!match.is_async) {
      return NextResponse.json({ error: 'Not an async match' }, { status: 400 })
    }

    // Create Redis session for this async match
    const questionIds = Array.isArray(match.questions_used)
      ? match.questions_used
      : JSON.parse(match.questions_used as string)

    await createGameSession(
      matchId,
      match.player1_fid,
      match.player2_fid || 0, // Will be 0 for solo async
      questionIds
    )

    // CRITICAL: If player1 has already completed, restore their score in Redis
    // This ensures opponent sees accurate scores during their playthrough
    if (match.player1_completed_at && match.player1_score > 0) {
      const { getRedis } = await import('@/lib/redis/client')
      const { GAME_CONFIG } = await import('@/lib/constants')
      const redis = await getRedis()
      const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`
      await redis.hSet(gameKey, 'player1_score', match.player1_score)
      console.log('[Start Async] Restored player1 score from DB:', match.player1_score)
    }

    // Similarly for player2 (if they're restarting)
    if (match.player2_completed_at && match.player2_score > 0) {
      const { getRedis } = await import('@/lib/redis/client')
      const { GAME_CONFIG } = await import('@/lib/constants')
      const redis = await getRedis()
      const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`
      await redis.hSet(gameKey, 'player2_score', match.player2_score)
      console.log('[Start Async] Restored player2 score from DB:', match.player2_score)
    }

    // Update match status to 'active' when player starts playing
    await supabase
      .from('matches')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', matchId)

    return NextResponse.json({
      success: true,
      match_id: matchId
    })
  } catch (error) {
    console.error('[Start Async] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start async game', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
