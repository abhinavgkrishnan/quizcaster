import { supabase } from './supabase'

/**
 * Send a notification to a Farcaster user
 * Requires user to have added your mini app and enabled notifications
 */

interface NotificationPayload {
  title: string
  body: string
  targetUrl: string
  notificationId: string
}

export async function sendNotification(fid: number, payload: NotificationPayload) {
  try {
    // Get user's notification token
    const { data: user } = await supabase
      .from('users')
      .select('notification_token, notification_url, notifications_enabled')
      .eq('fid', fid)
      .single()

    if (!user || !user.notifications_enabled || !user.notification_token || !user.notification_url) {
      console.log('[Notifications] User has notifications disabled or no token:', fid)
      return false
    }

    // Send notification to Farcaster client
    const response = await fetch(user.notification_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: payload.notificationId,
        title: payload.title,
        body: payload.body,
        targetUrl: payload.targetUrl,
        tokens: [user.notification_token]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Notifications] Failed to send:', error)
      throw new Error('Failed to send notification')
    }

    console.log('[Notifications] Sent successfully to FID:', fid)
    return true
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error)
    return false
  }
}

/**
 * Send batch notification to multiple users
 */
export async function sendBatchNotification(fids: number[], payload: NotificationPayload) {
  const results = await Promise.allSettled(
    fids.map(fid => sendNotification(fid, payload))
  )

  const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length
  console.log(`[Notifications] Sent ${successful}/${fids.length} notifications`)

  return results
}

/**
 * Notification templates for common events
 */

export function createChallengeNotification(challengerName: string, topic: string, matchId: string) {
  return {
    title: '🎮 New Challenge!',
    body: `${challengerName} challenged you to ${topic}`,
    targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/match/${matchId}`,
    notificationId: `challenge-${matchId}-${Date.now()}`
  }
}

export function createAsyncMatchReadyNotification(opponentName: string, matchId: string) {
  return {
    title: '🏆 Match Complete!',
    body: `${opponentName} finished your challenge`,
    targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/match/${matchId}/results`,
    notificationId: `match-complete-${matchId}`
  }
}

export function createFriendRequestNotification(requesterName: string, friendshipId: string) {
  return {
    title: '👋 Friend Request',
    body: `${requesterName} wants to be friends`,
    targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?screen=friends`,
    notificationId: `friend-request-${friendshipId}`
  }
}
