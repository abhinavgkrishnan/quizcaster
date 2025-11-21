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
      // Show pending, accepted, and in_progress challenges in sent tab
      query = query
        .eq('challenger_fid', fidNumber)
        .in('status', ['pending', 'accepted', 'in_progress'])
    } else {
      // Only show pending and accepted in received tab (hide in_progress from opponent)
      query = query
        .eq('challenged_fid', fidNumber)
        .in('status', ['pending', 'accepted'])
    }

    query = query.order('created_at', { ascending: false })

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
    console.log('[Challenge API] Request received:', JSON.stringify(body, null, 2))

    const { action, challenger_fid, challenged_fid, topic, challenge_id, match_id } = body

    if (action === 'create') {
      if (!challenger_fid || !topic) {
        console.error('[Challenge API] Missing fields:', { challenger_fid, topic, challenged_fid })
        return NextResponse.json({ error: 'Challenger FID and topic are required' }, { status: 400 })
      }

      if (!challenged_fid) {
        console.error('[Challenge API] Missing challenged_fid')
        return NextResponse.json({ error: 'Challenged FID is required' }, { status: 400 })
      }

      // Verify both users exist in database
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('fid')
        .in('fid', [challenger_fid, challenged_fid])

      if (usersError || !users || users.length < 2) {
        console.error('[Challenge API] User not in database')
        return NextResponse.json({ error: 'User not found in QuizCaster' }, { status: 404 })
      }

      // No challenge limit - users can send unlimited challenges

      // Get random questions for this topic
      const { data: questionResults, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('topic', topic)
        .eq('is_active', true)

      if (questionsError) throw questionsError

      if (!questionResults || questionResults.length < 10) {
        return NextResponse.json({ error: 'Not enough questions for this topic' }, { status: 400 })
      }

      // Randomly select 10 questions
      const shuffled = questionResults.sort(() => Math.random() - 0.5)
      const selectedQuestions = shuffled.slice(0, 10).map(q => q.id)

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
          questions_used: selectedQuestions
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
        const { TEXT } = await import('@/lib/constants/text')

        // Fetch user data and topic display name
        const [usersResponse, topicResponse] = await Promise.all([
          supabase
            .from('users')
            .select('fid, username, display_name, notification_token, notification_url, notifications_enabled')
            .in('fid', [challenger_fid, challenged_fid]),
          supabase
            .from('topics')
            .select('slug, display_name')
            .eq('slug', topic)
            .single()
        ])

        const challenger = usersResponse.data?.find(u => u.fid === challenger_fid)
        const challenged = usersResponse.data?.find(u => u.fid === challenged_fid)
        const topicDisplayName = topicResponse.data?.display_name || topic

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
              title: TEXT.CHALLENGE.NOTIF_NEW_TITLE,
              body: TEXT.CHALLENGE.NOTIF_NEW_BODY(challengerName, topicDisplayName),
              targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?challenge_notif=${challenge.id}`,
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

      // Get challenge details to check timing
      const { data: challengeData } = await supabase
        .from('async_challenges')
        .select('*, match_id')
        .eq('id', challenge_id)
        .single()

      if (!challengeData) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }

      // Check if accepted within 30 seconds
      const createdAt = new Date(challengeData.created_at).getTime()
      const now = Date.now()
      const acceptedWithin30Seconds = (now - createdAt) < 30000

      // Update challenge status to 'in_progress' so it's hidden from challenges list
      const { error } = await supabase
        .from('async_challenges')
        .update({
          status: 'in_progress',
          accepted_at: new Date().toISOString()
        })
        .eq('id', challenge_id)

      if (error) throw error

      // If accepted within 30s, convert to live match
      if (acceptedWithin30Seconds) {
        // Get match and questions
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .eq('id', challengeData.match_id)
          .single()

        if (match) {
          const questionIds = Array.isArray(match.questions_used)
            ? match.questions_used
            : JSON.parse(match.questions_used as string)

          // Create Redis/Socket session for live game
          const { createGameSession } = await import('@/lib/redis/game-state')
          await createGameSession(
            challengeData.match_id,
            match.player1_fid,
            match.player2_fid || 0,
            questionIds
          )

          // Update match to be live (not async)
          await supabase
            .from('matches')
            .update({
              is_async: false,
              status: 'active',
              started_at: new Date().toISOString()
            })
            .eq('id', challengeData.match_id)

          return NextResponse.json({
            success: true,
            match_id: challengeData.match_id,
            is_live: true
          })
        }
      }

      return NextResponse.json({
        success: true,
        match_id: challengeData.match_id,
        is_live: false
      })
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

    if (action === 'cancel') {
      if (!challenge_id) {
        return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
      }

      // Update challenge status
      const { data: challenge } = await supabase
        .from('async_challenges')
        .update({ status: 'cancelled' })
        .eq('id', challenge_id)
        .select('match_id')
        .single()

      // Update match status
      if (challenge?.match_id) {
        await supabase
          .from('matches')
          .update({
            status: 'cancelled',
            async_status: 'cancelled',
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

    console.error('[Challenge API] Invalid action:', action)
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Challenge API] Full error:', error)
    console.error('[Challenge API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'Failed to manage challenge',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
