/**
 * Matchmaking Leave API
 * Removes a player from the matchmaking queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { leaveMatchmakingQueue } from '@/lib/redis/matchmaking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, topic } = body;

    // Validation
    if (!fid || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, topic' },
        { status: 400 }
      );
    }

    // Remove from queue
    const removed = await leaveMatchmakingQueue(topic, fid);

    if (!removed) {
      return NextResponse.json(
        { error: 'Player not found in queue' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'removed',
      topic,
      message: 'Left matchmaking queue successfully'
    });
  } catch (error) {
    console.error('Error leaving matchmaking queue:', error);
    return NextResponse.json(
      { error: 'Failed to leave matchmaking queue' },
      { status: 500 }
    );
  }
}
