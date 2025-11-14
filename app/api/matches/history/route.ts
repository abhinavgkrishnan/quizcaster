import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * GET /api/matches/history?fid=123&limit=50&offset=0&topic=biology&opponent_fid=456
 * Get match history for a user with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const topic = searchParams.get('topic')
    const opponentFid = searchParams.get('opponent_fid')

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const fidNumber = parseInt(fid)
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    // Build query - simplified to avoid foreign key issues
    let query = supabase
      .from('matches')
      .select('*')
      .or(`player1_fid.eq.${fidNumber},player2_fid.eq.${fidNumber}`)
      .eq('status', 'completed')

    // Apply filters
    if (topic) {
      query = query.eq('topic', topic)
    }

    if (opponentFid) {
      const opponentFidNumber = parseInt(opponentFid)
      if (!isNaN(opponentFidNumber)) {
        query = query.or(`player1_fid.eq.${opponentFidNumber},player2_fid.eq.${opponentFidNumber}`)
      }
    }

    query = query
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: matches, error } = await query

    if (error) throw error

    // Get all unique opponent FIDs
    const opponentFids = new Set<number>()
    matches?.forEach((match: any) => {
      const opponentFid = match.player1_fid === fidNumber ? match.player2_fid : match.player1_fid
      if (opponentFid) opponentFids.add(opponentFid)
    })

    // Fetch opponent data
    const { data: opponents } = await supabase
      .from('users')
      .select('fid, username, display_name, pfp_url, active_flair')
      .in('fid', Array.from(opponentFids))

    const opponentMap = new Map(opponents?.map(o => [o.fid, o]) || [])

    // Format matches
    const formattedMatches = matches?.map((match: any) => {
      const isPlayer1 = match.player1_fid === fidNumber
      const myScore = isPlayer1 ? match.player1_score : match.player2_score
      const opponentScore = isPlayer1 ? match.player2_score : match.player1_score
      const opponentFid = isPlayer1 ? match.player2_fid : match.player1_fid
      const opponent = opponentMap.get(opponentFid)

      let result = 'draw'
      if (match.winner_fid === fidNumber) result = 'win'
      else if (match.winner_fid !== null) result = 'loss'

      return {
        id: match.id,
        topic: match.topic,
        my_score: myScore,
        opponent_score: opponentScore,
        result,
        opponent: {
          fid: opponent?.fid,
          username: opponent?.username,
          display_name: opponent?.display_name,
          pfp_url: opponent?.pfp_url,
          active_flair: opponent?.active_flair
        },
        completed_at: match.completed_at,
        is_async: match.is_async || false
      }
    }) || []

    // Get total count for pagination
    let countQuery = supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`player1_fid.eq.${fidNumber},player2_fid.eq.${fidNumber}`)
      .eq('status', 'completed')

    if (topic) countQuery = countQuery.eq('topic', topic)
    if (opponentFid) {
      const opponentFidNumber = parseInt(opponentFid)
      if (!isNaN(opponentFidNumber)) {
        countQuery = countQuery.or(`player1_fid.eq.${opponentFidNumber},player2_fid.eq.${opponentFidNumber}`)
      }
    }

    const { count } = await countQuery

    return NextResponse.json({
      matches: formattedMatches,
      total: count || 0,
      has_more: (offset + limit) < (count || 0)
    })
  } catch (error) {
    console.error('Error fetching match history:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        error: 'Failed to fetch match history',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
