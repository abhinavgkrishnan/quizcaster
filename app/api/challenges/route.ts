import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * GET /api/challenges?fid=123&type=sent|received
 * Get pending challenges
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')
    const type = searchParams.get('type') || 'received'

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const fidNumber = parseInt(fid)
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    let query = supabase
      .from('async_challenges')
      .select(`
        id,
        match_id,
        challenger_fid,
        challenged_fid,
        topic,
        status,
        challenge_message,
        created_at,
        expires_at,
        challenger:users!async_challenges_challenger_fid_fkey(fid, username, display_name, pfp_url, active_flair),
        challenged:users!async_challenges_challenged_fid_fkey(fid, username, display_name, pfp_url, active_flair)
      `)

    if (type === 'sent') {
      query = query.eq('challenger_fid', fidNumber)
    } else {
      query = query.eq('challenged_fid', fidNumber)
    }

    query = query
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })

    const { data: challenges, error } = await query

    if (error) throw error

    return NextResponse.json({ challenges: challenges || [] })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/challenges
 * Create or respond to a challenge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, challenger_fid, challenged_fid, topic, challenge_id, match_id } = body

    if (action === 'create') {
      if (!challenger_fid || !topic) {
        return NextResponse.json({ error: 'Challenger FID and topic are required' }, { status: 400 })
      }

      // Check pending challenge limit (5 max)
      const { count } = await supabase
        .from('async_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('challenger_fid', challenger_fid)
        .eq('status', 'pending')

      if (count && count >= 5) {
        return NextResponse.json({ error: 'Maximum 5 pending challenges allowed' }, { status: 429 })
      }

      // Create match first
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          match_type: 'async_challenge',
          topic,
          player1_fid: challenger_fid,
          player2_fid: challenged_fid,
          status: 'waiting',
          is_async: true,
          async_status: 'waiting_for_opponent',
          questions_used: []
        })
        .select()
        .single()

      if (matchError) throw matchError

      // Create challenge
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

      const { data: challenge, error: challengeError } = await supabase
        .from('async_challenges')
        .insert({
          match_id: match.id,
          challenger_fid,
          challenged_fid,
          topic,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (challengeError) throw challengeError

      // Send Farcaster notification to challenged user
      try {
        const { data: users } = await supabase
          .from('users')
          .select('fid, username, display_name, notification_token, notification_url, notifications_enabled')
          .in('fid', [challenger_fid, challenged_fid])

        const challenger = users?.find(u => u.fid === challenger_fid)
        const challenged = users?.find(u => u.fid === challenged_fid)

        if (challenged?.notifications_enabled && challenged.notification_token && challenged.notification_url) {
          const challengerName = challenger?.display_name || challenger?.username || 'Someone'

          await fetch(challenged.notification_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${challenged.notification_token}`
            },
            body: JSON.stringify({
              notificationId: crypto.randomUUID(),
              title: 'New Challenge! 🎮',
              body: `${challengerName} challenged you to ${topic}!`,
              targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?match=${match.id}`,
              tokens: [challenged.notification_token]
            })
          }).catch(err => {
            console.error('Failed to send Farcaster notification:', err)
          })

          console.log(`[Notification] Sent challenge notification to FID ${challenged_fid}`)
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
        // Don't fail the request if notification fails
      }

      return NextResponse.json({ success: true, challenge, match_id: match.id })
    }

    if (action === 'accept') {
      if (!challenge_id) {
        return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('async_challenges')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', challenge_id)

      if (error) throw error

      // Get match_id to return
      const { data: challenge } = await supabase
        .from('async_challenges')
        .select('match_id')
        .eq('id', challenge_id)
        .single()

      return NextResponse.json({ success: true, match_id: challenge?.match_id })
    }

    if (action === 'decline') {
      if (!challenge_id) {
        return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
      }

      // Update challenge status
      const { data: challenge } = await supabase
        .from('async_challenges')
        .update({ status: 'declined' })
        .eq('id', challenge_id)
        .select('match_id')
        .single()

      // Update match status
      if (challenge?.match_id) {
        await supabase
          .from('matches')
          .update({
            status: 'declined',
            async_status: 'declined',
            completed_at: new Date().toISOString()
          })
          .eq('id', challenge.match_id)
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'complete_challenger') {
      // Challenger finished playing, store their data
      if (!match_id || !body.challenger_data) {
        return NextResponse.json({ error: 'Match ID and challenger data required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('matches')
        .update({
          challenger_data: body.challenger_data,
          player1_score: body.challenger_data.score,
          player1_completed_at: new Date().toISOString(),
          async_status: 'waiting_for_opponent'
        })
        .eq('id', match_id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing challenge:', error)
    return NextResponse.json(
      { error: 'Failed to manage challenge' },
      { status: 500 }
    )
  }
}
