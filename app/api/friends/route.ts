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
    console.log('[Friends API] Request received:', JSON.stringify(body, null, 2))

    const { action, requester_fid, addressee_fid, friendship_id } = body

    if (action === 'send_request') {
      if (!requester_fid || !addressee_fid) {
        console.error('[Friends API] Missing FIDs:', { requester_fid, addressee_fid })
        return NextResponse.json({ error: 'Both FIDs are required' }, { status: 400 })
      }

      // Check if already friends or request exists
      const { data: existing, error: checkError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_fid.eq.${requester_fid},addressee_fid.eq.${addressee_fid}),and(requester_fid.eq.${addressee_fid},addressee_fid.eq.${requester_fid})`)
        .maybeSingle()

      if (checkError) {
        console.error('[Friends API] Error checking existing friendship:', checkError)
      }

      if (existing) {
        console.log('[Friends API] Friendship already exists:', existing)

        if (existing.status === 'accepted') {
          return NextResponse.json({ error: 'Already friends' }, { status: 409 })
        } else if (existing.status === 'pending') {
          return NextResponse.json({ error: 'Friend request already sent' }, { status: 409 })
        } else if (existing.status === 'declined') {
          // If previously declined, allow sending a new request by updating status
          const { error: updateError } = await supabase
            .from('friendships')
            .update({
              status: 'pending',
              requester_fid,
              addressee_fid,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (updateError) {
            console.error('[Friends API] Error updating declined friendship:', updateError)
            throw updateError
          }

          return NextResponse.json({ success: true, friendship: existing })
        }
      }

      // Ensure both users exist in the users table first
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('fid')
        .in('fid', [requester_fid, addressee_fid])

      if (usersError) {
        console.error('[Friends API] Error checking users:', usersError)
      }

      if (!users || users.length < 2) {
        console.error('[Friends API] One or both users not found in database')
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

      if (error) {
        console.error('[Friends API] Insert error:', error)
        console.error('[Friends API] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        throw error
      }

      console.log('[Friends API] Friend request created:', data)

      // Send Farcaster notification to addressee
      try {
        const { data: users } = await supabase
          .from('users')
          .select('fid, username, display_name, notification_token, notification_url, notifications_enabled')
          .in('fid', [requester_fid, addressee_fid])

        const requester = users?.find(u => u.fid === requester_fid)
        const addressee = users?.find(u => u.fid === addressee_fid)

        if (addressee?.notifications_enabled && addressee.notification_token && addressee.notification_url) {
          const requesterName = requester?.display_name || requester?.username || 'Someone'

          await fetch(addressee.notification_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${addressee.notification_token}`
            },
            body: JSON.stringify({
              notificationId: crypto.randomUUID(),
              title: 'New Friend Request! 👋',
              body: `${requesterName} wants to be friends!`,
              targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?screen=friends`,
              tokens: [addressee.notification_token]
            })
          }).catch(err => {
            console.error('Failed to send friend request notification:', err)
          })

          console.log(`[Notification] Sent friend request notification to FID ${addressee_fid}`)
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
        // Don't fail the request if notification fails
      }

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

    console.error('[Friends API] Invalid action:', action)
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Friends API] Full error:', error)
    console.error('[Friends API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'Failed to manage friends',
        details: error instanceof Error ? error.message : String(error)
      },
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
