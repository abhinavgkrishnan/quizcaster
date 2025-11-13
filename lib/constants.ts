/**
 * Game Configuration Constants
 * Central location for all game-related configuration values
 */

export const GAME_CONFIG = {
  // Match Configuration
  QUESTIONS_PER_MATCH: 10,
  QUESTION_TIME_LIMIT: 10, // seconds
  OPTIONS_LOAD_DELAY: 1400, // milliseconds before options appear (increased for suspense)

  // TTL Configuration
  MATCH_TTL: 3600, // 1 hour in seconds
  MATCHMAKING_TIMEOUT: 180, // 3 minutes in seconds (increased from 30s)
  ANSWER_TTL: 3600, // 1 hour in seconds

  // Connection Configuration
  HEARTBEAT_INTERVAL: 5000, // 5 seconds in milliseconds
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000, // 1 second

  // Matchmaking Configuration
  MATCHMAKING_PROCESS_INTERVAL: 2000, // 2 seconds in milliseconds
  MAX_SKILL_DIFFERENCE: 200, // ELO/skill rating difference
  SKILL_TOLERANCE_INCREASE: 50, // Increase per 5 seconds waiting

  // Redis Key Prefixes
  REDIS_PREFIX: {
    GAME: 'game:',
    MATCHMAKING: 'matchmaking:',
    ANSWERS: 'answers:',
    ONLINE: 'online:players',
    SESSION: 'session:',
  }
} as const;

export const SCORING = {
  // Base Points
  CORRECT_BASE: 10,
  TIME_BONUS_MAX: 10,
  FINAL_QUESTION_MULTIPLIER: 2, // 2x points for final question

  // Time-based Scoring Thresholds (faster = more points)
  TIME_THRESHOLDS: [
    { maxTime: 1, points: 20 },
    { maxTime: 2, points: 18 },
    { maxTime: 3, points: 16 },
    { maxTime: 4, points: 14 },
    { maxTime: 5, points: 12 },
    { maxTime: 10, points: 10 },
  ],

  // Validation
  MIN_TIME: 0, // milliseconds
  MAX_TIME: 10000, // 10 seconds in milliseconds
} as const;

export const MATCH_TYPES = {
  REALTIME: 'realtime',
  ASYNC: 'async',
} as const;

export const MATCH_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
} as const;

export const PLAYER_STATUS = {
  ONLINE: 'online',
  IN_GAME: 'in_game',
  IDLE: 'idle',
  OFFLINE: 'offline',
} as const;

// Type exports for TypeScript
export type MatchType = typeof MATCH_TYPES[keyof typeof MATCH_TYPES];
export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];
export type PlayerStatus = typeof PLAYER_STATUS[keyof typeof PLAYER_STATUS];
