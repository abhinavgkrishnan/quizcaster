import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * GET /api/friends?fid=123
 * Get user's friends and friend requests
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')
    const action = searchParams.get('action') // 'list' or 'pending'

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const fidNumber = parseInt(fid)
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    if (action === 'pending') {
      // Get pending friend requests (incoming)
      const { data: requests } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_fid,
          created_at,
          requester:users!friendships_requester_fid_fkey(fid, username, display_name, pfp_url)
        `)
        .eq('addressee_fid', fidNumber)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      return NextResponse.json({ requests: requests || [] })
    }

    // Get accepted friends (both directions)
    const { data: friends } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_fid,
        addressee_fid,
        requester:users!friendships_requester_fid_fkey(fid, username, display_name, pfp_url, active_flair),
        addressee:users!friendships_addressee_fid_fkey(fid, username, display_name, pfp_url, active_flair)
      `)
      .or(`requester_fid.eq.${fidNumber},addressee_fid.eq.${fidNumber}`)
      .eq('status', 'accepted')

    // Format friends list (exclude self)
    const friendsList = friends?.map((f: any) => {
      const isSelf = f.requester_fid === fidNumber
      const friend = isSelf ? f.addressee : f.requester
      return {
        fid: friend.fid,
        username: friend.username,
        display_name: friend.display_name,
        pfp_url: friend.pfp_url,
        active_flair: friend.active_flair
      }
    }) || []

    return NextResponse.json({ friends: friendsList })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/friends
 * Send friend request, accept, or decline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, requester_fid, addressee_fid, friendship_id } = body

    if (action === 'send_request') {
      if (!requester_fid || !addressee_fid) {
        return NextResponse.json({ error: 'Both FIDs are required' }, { status: 400 })
      }

      // Check if already friends or request exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_fid.eq.${requester_fid},addressee_fid.eq.${addressee_fid}),and(requester_fid.eq.${addressee_fid},addressee_fid.eq.${requester_fid})`)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Friendship already exists' }, { status: 409 })
      }

      // Create friend request
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_fid,
          addressee_fid,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, friendship: data })
    }

    if (action === 'accept') {
      if (!friendship_id) {
        return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendship_id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'decline') {
      if (!friendship_id) {
        return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', friendship_id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing friends:', error)
    return NextResponse.json(
      { error: 'Failed to manage friends' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/friends
 * Remove a friend
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const friendship_id = searchParams.get('id')

    if (!friendship_id) {
      return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendship_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing friend:', error)
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    )
  }
}
