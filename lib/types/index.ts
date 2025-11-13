/**
 * Central Type Export Hub
 * Import all types from this single location
 */

// Game types
export type {
  PlayerData,
  Question,
  PlayerScore,
  MatchData,
  AppScreen,
  GamePhase,
} from './game';

// User types
export type {
  FarcasterUser,
  UserStats,
} from './user';

// Re-export commonly used types from other modules
export type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
export type { MatchType, MatchStatus, PlayerStatus } from '@/lib/constants';
