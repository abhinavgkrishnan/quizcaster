/**
 * DEV ONLY - Clear Redis Cache
 * Useful for testing - clears all game sessions and queues
 */

import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis/client';

export async function POST() {
  try {
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      return NextResponse.json({ error: 'Only available in dev mode' }, { status: 403 });
    }

    const redis = await getRedis();

    // Clear all matchmaking queues
    const matchmakingKeys = await redis.keys('matchmaking:*');
    if (matchmakingKeys.length > 0) {
      await redis.del(matchmakingKeys);
    }

    // Clear all game sessions
    const gameKeys = await redis.keys('game:*');
    if (gameKeys.length > 0) {
      await redis.del(gameKeys);
    }

    // Clear all answer keys
    const answerKeys = await redis.keys('*:answers:*');
    if (answerKeys.length > 0) {
      await redis.del(answerKeys);
    }

    return NextResponse.json({
      cleared: {
        matchmaking: matchmakingKeys.length,
        games: gameKeys.length,
        answers: answerKeys.length,
      },
      message: 'Redis cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing Redis:', error);
    return NextResponse.json(
      { error: 'Failed to clear Redis' },
      { status: 500 }
    );
  }
}
