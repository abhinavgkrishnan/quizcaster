/**
 * Redis Matchmaking Operations
 * Handles matchmaking queue using Redis Sorted Sets
 */

import { getRedis } from './client';
import { GAME_CONFIG } from '@/lib/constants';
import type { MatchmakingPlayer } from './types';

/**
 * Add player to matchmaking queue
 */
export async function joinMatchmakingQueue(
  topic: string,
  player: MatchmakingPlayer
): Promise<void> {
  const redis = await getRedis();
  const queueKey = `${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}${topic}`;

  // Use joinedAt timestamp as score for FIFO ordering
  await redis.zAdd(queueKey, {
    score: player.joinedAt,
    value: JSON.stringify(player),
  });

  // Set TTL on queue
  await redis.expire(queueKey, GAME_CONFIG.MATCHMAKING_TIMEOUT);
}

/**
 * Remove player from matchmaking queue
 */
export async function leaveMatchmakingQueue(
  topic: string,
  fid: number
): Promise<boolean> {
  const redis = await getRedis();
  const queueKey = `${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}${topic}`;

  // Get all members
  const members = await redis.zRange(queueKey, 0, -1);

  // Find and remove player by FID
  for (const member of members) {
    const player: MatchmakingPlayer = JSON.parse(member);
    if (player.fid === fid) {
      await redis.zRem(queueKey, member);
      return true;
    }
  }

  return false;
}

/**
 * Get queue size for a topic
 */
export async function getQueueSize(topic: string): Promise<number> {
  const redis = await getRedis();
  const queueKey = `${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}${topic}`;

  return await redis.zCard(queueKey);
}

/**
 * Get player's position in queue
 */
export async function getPlayerQueuePosition(
  topic: string,
  fid: number
): Promise<number | null> {
  const redis = await getRedis();
  const queueKey = `${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}${topic}`;

  const members = await redis.zRange(queueKey, 0, -1);

  for (let i = 0; i < members.length; i++) {
    const player: MatchmakingPlayer = JSON.parse(members[i]);
    if (player.fid === fid) {
      return i + 1; // Return 1-indexed position
    }
  }

  return null;
}

/**
 * Find and create a match from the queue
 * Returns matched players or null if no match found
 */
export async function findMatch(
  topic: string
): Promise<{ player1: MatchmakingPlayer; player2: MatchmakingPlayer } | null> {
  const redis = await getRedis();
  const queueKey = `${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}${topic}`;

  // Get 2 oldest players (lowest scores/earliest timestamps)
  const members = await redis.zRangeWithScores(queueKey, 0, 1);

  if (!members || members.length < 2) {
    return null;
  }

  // Remove them from queue
  await redis.zRem(queueKey, [members[0].value, members[1].value]);

  const player1: MatchmakingPlayer = JSON.parse(members[0].value);
  const player2: MatchmakingPlayer = JSON.parse(members[1].value);

  // Optional: Check skill level compatibility
  const skillDiff = Math.abs(player1.skillLevel - player2.skillLevel);
  const waitTime = (Date.now() - Math.max(player1.joinedAt, player2.joinedAt)) / 1000; // seconds

  // Flexible matching: increase tolerance over time
  const maxSkillDiff = GAME_CONFIG.MAX_SKILL_DIFFERENCE +
    Math.floor(waitTime / 5) * GAME_CONFIG.SKILL_TOLERANCE_INCREASE;

  if (skillDiff > maxSkillDiff) {
    // Skills too different, put them back for now
    await redis.zAdd(queueKey, [
      { score: members[0].score, value: members[0].value },
      { score: members[1].score, value: members[1].value },
    ]);
    return null;
  }

  return { player1, player2 };
}

/**
 * Get all players in queue for a topic
 */
export async function getQueuePlayers(topic: string): Promise<MatchmakingPlayer[]> {
  const redis = await getRedis();
  const queueKey = `${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}${topic}`;

  const members = await redis.zRange(queueKey, 0, -1);

  return members.map((member) => JSON.parse(member));
}

/**
 * Check if player is in any queue
 */
export async function isPlayerInQueue(
  fid: number,
  topics?: string[]
): Promise<{ inQueue: boolean; topic?: string }> {
  const redis = await getRedis();

  // If topics not provided, scan all matchmaking keys
  if (!topics || topics.length === 0) {
    // Get all matchmaking keys
    const keys = await redis.keys(`${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}*`);

    for (const key of keys) {
      const members = await redis.zRange(key, 0, -1);
      for (const member of members) {
        const player: MatchmakingPlayer = JSON.parse(member);
        if (player.fid === fid) {
          const topic = key.replace(GAME_CONFIG.REDIS_PREFIX.MATCHMAKING, '');
          return { inQueue: true, topic };
        }
      }
    }

    return { inQueue: false };
  }

  // Check specific topics
  for (const topic of topics) {
    const queueKey = `${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}${topic}`;
    const members = await redis.zRange(queueKey, 0, -1);

    for (const member of members) {
      const player: MatchmakingPlayer = JSON.parse(member);
      if (player.fid === fid) {
        return { inQueue: true, topic };
      }
    }
  }

  return { inQueue: false };
}

/**
 * Clear stale players from queue (cleanup job)
 */
export async function clearStaleQueues(): Promise<number> {
  const redis = await getRedis();
  let clearedCount = 0;

  // Get all matchmaking keys
  const keys = await redis.keys(`${GAME_CONFIG.REDIS_PREFIX.MATCHMAKING}*`);

  for (const key of keys) {
    const members = await redis.zRange(key, 0, -1);
    const now = Date.now();

    for (const member of members) {
      const player: MatchmakingPlayer = JSON.parse(member);

      // Remove players who have been waiting longer than timeout
      if (now - player.joinedAt > GAME_CONFIG.MATCHMAKING_TIMEOUT * 1000) {
        await redis.zRem(key, member);
        clearedCount++;
      }
    }
  }

  return clearedCount;
}
