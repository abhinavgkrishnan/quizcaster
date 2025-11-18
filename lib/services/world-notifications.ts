/**
 * World App Notifications Service
 * Sends push notifications to World App users via Developer Portal API
 */

interface SendNotificationParams {
  walletAddresses: string[]
  title: string
  message: string
  miniAppPath?: string
}

export class WorldNotificationsService {
  private apiKey: string
  private appId: string

  constructor() {
    this.apiKey = process.env.DEV_PORTAL_API_KEY || ''
    this.appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || ''
  }

  /**
   * Send notification to World App users
   * @param params Notification parameters
   * @returns Success status
   */
  async sendNotification(params: SendNotificationParams): Promise<boolean> {
    if (!this.apiKey || !this.appId) {
      console.error('[World Notifications] API key or App ID not configured')
      return false
    }

    try {
      const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.appId,
          wallet_addresses: params.walletAddresses,
          localisations: [
            {
              language: 'en',
              title: params.title,
              message: params.message,
            }
          ],
          mini_app_path: params.miniAppPath || `worldapp://mini-app?app_id=${this.appId}`,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('[World Notifications] Failed to send:', error)
        return false
      }

      console.log(`[World Notifications] Sent to ${params.walletAddresses.length} users`)
      return true
    } catch (error) {
      console.error('[World Notifications] Error:', error)
      return false
    }
  }

  /**
   * Send friend request notification
   */
  async sendFriendRequest(toWalletAddress: string, fromUsername: string): Promise<boolean> {
    return this.sendNotification({
      walletAddresses: [toWalletAddress],
      title: 'New Friend Request! 👋',
      message: `${fromUsername} wants to be friends!`,
      miniAppPath: `worldapp://mini-app?app_id=${this.appId}&path=%2F%3Fscreen%3Dfriends`,
    })
  }

  /**
   * Send challenge notification
   */
  async sendChallenge(toWalletAddress: string, fromUsername: string, topic: string, matchId: string): Promise<boolean> {
    return this.sendNotification({
      walletAddresses: [toWalletAddress],
      title: `⚔️ ${fromUsername} challenged you!`,
      message: `Think you know ${topic}? Prove it! ${fromUsername} is waiting...`,
      miniAppPath: `worldapp://mini-app?app_id=${this.appId}&path=%2F%3Fchallenge_notif%3D${matchId}`,
    })
  }

  /**
   * Send match result notification
   */
  async sendMatchResult(toWalletAddress: string, won: boolean, opponentUsername: string): Promise<boolean> {
    return this.sendNotification({
      walletAddresses: [toWalletAddress],
      title: won ? '🎉 You Won!' : '😔 Match Complete',
      message: won
        ? `You defeated ${opponentUsername}! Great job, \${username}!`
        : `${opponentUsername} won this time. Get your revenge!`,
      miniAppPath: `worldapp://mini-app?app_id=${this.appId}`,
    })
  }
}

// Export singleton instance
export const worldNotifications = new WorldNotificationsService()
