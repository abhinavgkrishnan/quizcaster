import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * POST /api/matches/[id]/complete-async
 * Mark player as completed in async match and update stats if both done
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const body = await request.json()
    const { fid, score } = body

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const isPlayer1 = match.player1_fid === fid

    // Update match with completion timestamp and score
    const updateData: any = {}
    if (isPlayer1) {
      updateData.player1_score = score
      updateData.player1_completed_at = new Date().toISOString()
    } else {
      updateData.player2_score = score
      updateData.player2_completed_at = new Date().toISOString()
    }

    // Check if both players completed
    const bothCompleted = isPlayer1
      ? (match.player2_completed_at && true)
      : (match.player1_completed_at && true)

    if (bothCompleted) {
      // Calculate winner
      const p1Score = isPlayer1 ? score : match.player1_score
      const p2Score = isPlayer1 ? match.player2_score : score

      let winnerFid: number | null = null
      if (p1Score > p2Score) {
        winnerFid = match.player1_fid
      } else if (p2Score > p1Score) {
        winnerFid = match.player2_fid
      }

      updateData.status = 'completed'
      updateData.winner_fid = winnerFid
      updateData.completed_at = new Date().toISOString()

      // Send notification to challenger that opponent has completed
      const challengerFid = isPlayer1 ? match.player2_fid : match.player1_fid

      try {
        const { data: users } = await supabase
          .from('users')
          .select('fid, username, display_name, notification_token, notification_url, notifications_enabled')
          .in('fid', [fid, challengerFid])

        const challenger = users?.find(u => u.fid === challengerFid)
        const opponent = users?.find(u => u.fid === fid)

        if (challenger?.notifications_enabled && challenger.notification_token && challenger.notification_url) {
          const opponentName = opponent?.display_name || opponent?.username || 'Someone'

          await fetch(challenger.notification_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${challenger.notification_token}`
            },
            body: JSON.stringify({
              notificationId: crypto.randomUUID(),
              title: 'Challenge Complete!',
              body: `${opponentName} finished your challenge!`,
              targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?match=${matchId}`,
              tokens: [challenger.notification_token]
            })
          }).catch(err => {
            console.error('Failed to send notification:', err)
          })
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
      }
    }

    // Update match
    await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)

    return NextResponse.json({
      success: true,
      completed: bothCompleted,
      score
    })
  } catch (error) {
    console.error('[Complete Async] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete match', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
