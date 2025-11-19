import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * GET /api/matches/[id]/answers?fid=123
 * Get match answers for a specific player
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
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    // Fetch answers from Supabase
    const { data: answers, error } = await supabase
      .from('match_answers')
      .select('*')
      .eq('match_id', matchId)
      .eq('fid', fidNumber)
      .order('question_number')

    if (error) throw error

    return NextResponse.json({ answers: answers || [] })
  } catch (error) {
    console.error('Error fetching match answers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match answers' },
      { status: 500 }
    )
  }
}
