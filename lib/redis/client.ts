/**
 * Redis Client Singleton
 * Manages Redis connection with automatic reconnection and error handling
 */

import { createClient, RedisClientType } from 'redis';
import { GAME_CONFIG } from '@/lib/constants';

let redis: RedisClientType | null = null;
let isConnecting = false;

/**
 * Get or create Redis client singleton
 * Implements connection pooling and automatic reconnection
 */
export async function getRedis(): Promise<RedisClientType> {
  // Return existing connection if available
  if (redis && redis.isOpen) {
    return redis;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait for ongoing connection
    await new Promise(resolve => setTimeout(resolve, 100));
    return getRedis();
  }

  try {
    isConnecting = true;

    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    // Create new client
    redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > GAME_CONFIG.RECONNECT_ATTEMPTS) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
          const delay = Math.min(retries * 50, 1000);
          return delay;
        },
        connectTimeout: 10000, // 10 seconds
      },
    });

    // Event handlers
    redis.on('error', (err) => {
      console.error('[Redis] Client Error:', err);
    });

    redis.on('connect', () => {
    });

    redis.on('reconnecting', () => {
    });

    redis.on('ready', () => {
    });

    // Connect
    await redis.connect();

    isConnecting = false;
    return redis;
  } catch (error) {
    isConnecting = false;
    redis = null;
    console.error('Redis: Failed to connect:', error);
    throw error;
  }
}

/**
 * Close Redis connection gracefully
 * Should be called on server shutdown
 */
export async function closeRedis(): Promise<void> {
  if (redis && redis.isOpen) {
    try {
      await redis.quit();
      redis = null;
    } catch (error) {
      console.error('Redis: Error closing connection:', error);
      // Force close if graceful quit fails
      if (redis) {
        await redis.disconnect();
        redis = null;
      }
    }
  }
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return redis !== null && redis.isOpen;
}

/**
 * Ping Redis to check connection health
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const client = await getRedis();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis: Ping failed:', error);
    return false;
  }
}
