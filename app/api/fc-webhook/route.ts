import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * Farcaster Mini App Webhook Handler
 * Receives events when users add/remove your app or toggle notifications
 *
 * Events: miniapp_added, miniapp_removed, notifications_enabled, notifications_disabled
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Parse the webhook event (it comes as a signed JFS message)
    // For now, we'll parse it directly - you can add verification later with @farcaster/miniapp-node
    const { event, notificationDetails } = body.payload ? JSON.parse(
      Buffer.from(body.payload, 'base64url').toString()
    ) : body

    // Extract FID from header
    const fid = body.header ? JSON.parse(
      Buffer.from(body.header, 'base64url').toString()
    ).fid : null

    if (!fid) {
      console.error('[FC Webhook] No FID in webhook event')
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    console.log('[FC Webhook] Received event:', event, 'for FID:', fid)

    switch (event) {
      case 'miniapp_added':
        // User added your app, save notification token
        if (notificationDetails) {
          await supabase
            .from('users')
            .update({
              notification_token: notificationDetails.token,
              notification_url: notificationDetails.url,
              notifications_enabled: true
            })
            .eq('fid', fid)

          console.log('[FC Webhook] Saved notification token for FID:', fid)
        }
        break

      case 'miniapp_removed':
        // User removed your app
        await supabase
          .from('users')
          .update({
            notification_token: null,
            notification_url: null,
            notifications_enabled: false
          })
          .eq('fid', fid)

        console.log('[FC Webhook] Removed notification token for FID:', fid)
        break

      case 'notifications_enabled':
        // User re-enabled notifications
        if (notificationDetails) {
          await supabase
            .from('users')
            .update({
              notification_token: notificationDetails.token,
              notification_url: notificationDetails.url,
              notifications_enabled: true
            })
            .eq('fid', fid)

          console.log('[FC Webhook] Re-enabled notifications for FID:', fid)
        }
        break

      case 'notifications_disabled':
        // User disabled notifications
        await supabase
          .from('users')
          .update({
            notification_token: null,
            notification_url: null,
            notifications_enabled: false
          })
          .eq('fid', fid)

        console.log('[FC Webhook] Disabled notifications for FID:', fid)
        break

      default:
        console.log('[FC Webhook] Unknown event:', event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FC Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
