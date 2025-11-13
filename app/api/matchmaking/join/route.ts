/**
 * Matchmaking Join API
 * Adds a player to the matchmaking queue for a specific topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { joinMatchmakingQueue, isPlayerInQueue } from '@/lib/redis/matchmaking';
import { supabase } from '@/lib/utils/supabase';
import type { MatchmakingPlayer } from '@/lib/redis/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { fid, username, displayName, pfpUrl, topic, skillLevel = 1000 } = body;

    // Validation
    if (!fid || !username || !topic) {
      console.error('[API] Validation failed:', { fid, username, topic });
      return NextResponse.json(
        { error: 'Missing required fields: fid, username, topic' },
        { status: 400 }
      );
    }

    // Check if player is already in a queue
    const { inQueue, topic: existingTopic } = await isPlayerInQueue(fid);

    if (inQueue) {
      return NextResponse.json(
        {
          error: 'Already in matchmaking queue',
          current_topic: existingTopic
        },
        { status: 409 }
      );
    }

    // Create player object
    const player: MatchmakingPlayer = {
      fid,
      username,
      displayName: displayName || username,
      pfpUrl,
      skillLevel,
      joinedAt: Date.now(),
    };


    // Ensure user exists in database (required for foreign key constraints)
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        fid,
        username,
        display_name: displayName || username,
        pfp_url: pfpUrl || null,
        last_active: new Date().toISOString(),
      }, {
        onConflict: 'fid'
      });

    if (userError) {
      console.error('[API] Error upserting user:', userError);
      // Don't fail - user might already exist
    } else {
    }

    // Add to queue
    await joinMatchmakingQueue(topic, player);


    return NextResponse.json({
      status: 'queued',
      topic,
      position: 'calculating', // Will be updated by status endpoint
      message: 'Joined matchmaking queue successfully'
    });
  } catch (error) {
    console.error('[API] Error joining matchmaking queue:', error);
    return NextResponse.json(
      { error: 'Failed to join matchmaking queue', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
