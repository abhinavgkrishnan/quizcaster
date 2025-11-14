import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * GET /api/flairs?fid=123&topic=biology
 * Get available and earned flairs for a user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')
    const topic = searchParams.get('topic')

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const fidNumber = parseInt(fid)
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    // Get user's earned flairs and active flair
    const { data: user } = await supabase
      .from('users')
      .select('earned_flairs, active_flair')
      .eq('fid', fidNumber)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If topic specified, get flairs for that topic
    if (topic) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('flairs')
        .eq('slug', topic)
        .single()

      // Get user's wins for this topic
      const { data: topicStats } = await supabase
        .from('user_stats_by_topic')
        .select('matches_won')
        .eq('fid', fidNumber)
        .eq('topic', topic)
        .single()

      const wins = topicStats?.matches_won || 0

      return NextResponse.json({
        available_flairs: topicData?.flairs || [],
        earned_flairs: user.earned_flairs || [],
        active_flair: user.active_flair,
        current_wins: wins
      })
    }

    // Return all earned flairs
    return NextResponse.json({
      earned_flairs: user.earned_flairs || [],
      active_flair: user.active_flair
    })
  } catch (error) {
    console.error('Error fetching flairs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flairs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/flairs
 * Set active flair or check/award new flairs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, action, flair_id, topic } = body

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    if (action === 'set_active') {
      // Set active flair
      const { data: user } = await supabase
        .from('users')
        .select('earned_flairs')
        .eq('fid', fid)
        .single()

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Verify user has earned this flair
      const earnedFlairs = user.earned_flairs as any[] || []
      const hasFlair = earnedFlairs.some((f: any) => f.id === flair_id)

      if (!hasFlair && flair_id !== null) {
        return NextResponse.json({ error: 'Flair not earned' }, { status: 403 })
      }

      // Get flair details
      let activeFlair = null
      if (flair_id) {
        const earned = earnedFlairs.find((f: any) => f.id === flair_id)
        activeFlair = earned
      }

      await supabase
        .from('users')
        .update({ active_flair: activeFlair })
        .eq('fid', fid)

      return NextResponse.json({ success: true, active_flair: activeFlair })
    }

    if (action === 'check_and_award') {
      // Check if user earned new flairs
      if (!topic) {
        return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
      }

      const { data: topicData } = await supabase
        .from('topics')
        .select('flairs')
        .eq('slug', topic)
        .single()

      const { data: user } = await supabase
        .from('users')
        .select('earned_flairs')
        .eq('fid', fid)
        .single()

      const { data: topicStats } = await supabase
        .from('user_stats_by_topic')
        .select('matches_won')
        .eq('fid', fid)
        .eq('topic', topic)
        .single()

      const wins = topicStats?.matches_won || 0
      const earnedFlairs = (user?.earned_flairs as any[]) || []
      const availableFlairs = (topicData?.flairs as any[]) || []

      // Check which flairs should be awarded
      const newFlairs: any[] = []
      for (const flair of availableFlairs) {
        const alreadyEarned = earnedFlairs.some((f: any) => f.id === flair.id)
        if (!alreadyEarned && wins >= flair.requirement.count) {
          newFlairs.push({ ...flair, topic, earned_at: new Date().toISOString() })
        }
      }

      if (newFlairs.length > 0) {
        const updatedFlairs = [...earnedFlairs, ...newFlairs]
        await supabase
          .from('users')
          .update({ earned_flairs: updatedFlairs })
          .eq('fid', fid)

        return NextResponse.json({ success: true, new_flairs: newFlairs })
      }

      return NextResponse.json({ success: true, new_flairs: [] })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating flairs:', error)
    return NextResponse.json(
      { error: 'Failed to update flairs' },
      { status: 500 }
    )
  }
}
