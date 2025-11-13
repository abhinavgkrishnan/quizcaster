/**
 * Matchmaking Status API
 * Get player's current position and queue information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueSize, getPlayerQueuePosition } from '@/lib/redis/matchmaking';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = parseInt(searchParams.get('fid') || '0');
    const topic = searchParams.get('topic');

    // Validation
    if (!fid || !topic) {
      return NextResponse.json(
        { error: 'Missing required parameters: fid, topic' },
        { status: 400 }
      );
    }

    // Get queue info
    const queueSize = await getQueueSize(topic);
    const position = await getPlayerQueuePosition(topic, fid);

    if (position === null) {
      return NextResponse.json(
        { error: 'Player not in queue' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      in_queue: true,
      topic,
      position,
      queue_size: queueSize,
      estimated_wait_time: Math.max(0, (position / 2) * 2), // Rough estimate in seconds
    });
  } catch (error) {
    console.error('Error fetching matchmaking status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matchmaking status' },
      { status: 500 }
    );
  }
}
