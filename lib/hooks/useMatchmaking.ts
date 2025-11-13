/**
 * useMatchmaking Hook
 * Manages matchmaking queue and notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createMatchmakingChannel, setupMatchmakingListeners } from '@/lib/utils/realtime';
import type { PlayerData } from '@/lib/types';

interface MatchmakingState {
  isSearching: boolean;
  queuePosition: number | null;
  queueSize: number | null;
  estimatedWaitTime: number | null;
  error: string | null;
}

interface MatchFoundPayload {
  match_id: string;
  player1: PlayerData;
  player2: PlayerData;
  topic: string;
}

export function useMatchmaking(
  topic: string,
  playerFid: number,
  playerUsername: string,
  onMatchFound: (matchData: MatchFoundPayload) => void
) {
  const [state, setState] = useState<MatchmakingState>({
    isSearching: false,
    queuePosition: null,
    queueSize: null,
    estimatedWaitTime: null,
    error: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const matchFoundRef = useRef<boolean>(false); // Guard flag

  // Join matchmaking queue
  const joinQueue = useCallback(async (displayName?: string, pfpUrl?: string, skillLevel?: number) => {
    try {
      setState(prev => ({ ...prev, isSearching: true, error: null }));

      // Join queue via API
      const response = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: playerFid,
          username: playerUsername,
          displayName: displayName || playerUsername,
          pfpUrl,
          topic,
          skillLevel: skillLevel || 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join queue');
      }

      // Setup Realtime channel to listen for match
      const channel = createMatchmakingChannel(topic);
      channelRef.current = channel;

      setupMatchmakingListeners(channel, (payload) => {
        // Check if this match includes us
        if (payload.player1.fid === playerFid || payload.player2.fid === playerFid) {
          // Set flag FIRST to stop any pending interval callbacks
          matchFoundRef.current = true;

          // IMMEDIATELY stop all intervals before notifying parent
          if (processorIntervalRef.current) {
            clearInterval(processorIntervalRef.current);
            processorIntervalRef.current = null;
          }
          if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
          }

          // Unsubscribe from channel
          if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
          }

          // Set searching to false
          setState(prev => ({ ...prev, isSearching: false }));

          // Notify parent
          onMatchFound(payload);
        }
      });

      // Always run processor client-side (works in both dev and prod)
      // Trigger processor every 2 seconds
      processorIntervalRef.current = setInterval(async () => {
        if (matchFoundRef.current) return; // Stop if match found

        try {
          const processResponse = await fetch('/api/matchmaking/process', {
            method: 'POST',
          });
          await processResponse.json();
        } catch (err) {
          console.error('[Matchmaking] Error triggering processor:', err);
        }
      }, 2000);

      // Poll for queue status
      statusIntervalRef.current = setInterval(async () => {
        if (matchFoundRef.current) return; // Stop if match found

        try {
          const statusResponse = await fetch(
            `/api/matchmaking/status?fid=${playerFid}&topic=${topic}`
          );

          if (statusResponse.ok) {
            const data = await statusResponse.json();
            setState(prev => ({
              ...prev,
              queuePosition: data.position,
              queueSize: data.queue_size,
              estimatedWaitTime: data.estimated_wait_time,
            }));
          }
        } catch (err) {
          console.error('Error fetching queue status:', err);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      console.error('Error joining matchmaking:', error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [topic, playerFid, playerUsername, onMatchFound]);

  // Leave matchmaking queue
  const leaveQueue = useCallback(async () => {
    try {
      // Clear processor interval
      if (processorIntervalRef.current) {
        clearInterval(processorIntervalRef.current);
        processorIntervalRef.current = null;
      }

      // Clear status polling
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }

      // Cleanup channel
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Leave queue via API
      if (state.isSearching) {
        await fetch('/api/matchmaking/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid: playerFid, topic }),
        });
      }

      setState({
        isSearching: false,
        queuePosition: null,
        queueSize: null,
        estimatedWaitTime: null,
        error: null,
      });
    } catch (error) {
      console.error('Error leaving matchmaking:', error);
    }
  }, [topic, playerFid, state.isSearching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processorIntervalRef.current) {
        clearInterval(processorIntervalRef.current);
      }
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    ...state,
    joinQueue,
    leaveQueue,
  };
}
