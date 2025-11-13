/**
 * Supabase Realtime Channel Utilities
 * Used for matchmaking notifications
 * (Game logic now handled by Socket.IO)
 */

import { supabase } from '@/lib/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Create matchmaking channel for a topic
 */
export function createMatchmakingChannel(topic: string): RealtimeChannel {
  const channelName = `matchmaking:${topic}`;
  return supabase.channel(channelName);
}

/**
 * Setup matchmaking listeners
 */
export function setupMatchmakingListeners(
  channel: RealtimeChannel,
  onMatchFound: (payload: any) => void
): void {
  channel
    .on('broadcast', { event: 'match_found' }, ({ payload }) => {
      onMatchFound(payload);
    })
    .subscribe();
}

/**
 * Broadcast game complete event
 * (Legacy - kept for API compatibility)
 */
export async function broadcastGameComplete(
  channel: RealtimeChannel,
  data: { winnerFid: number | null; scores: { p1: number; p2: number } }
): Promise<void> {
  await channel.send({
    type: 'broadcast',
    event: 'game_complete',
    payload: data,
  });
}
