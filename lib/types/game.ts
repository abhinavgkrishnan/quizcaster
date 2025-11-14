/**
 * Consolidated Game Types
 * Central definitions for game-related data structures
 */

// Re-export Socket.IO types for convenience
export type { PlayerData, Question, PlayerScore } from '@/lib/socket/events';

/**
 * Match data structure used throughout the application
 */
export interface MatchData {
  match_id: string;
  myPlayer: PlayerData;
  opponent: PlayerData;
}

/**
 * Application screen/view types
 */
export type AppScreen = "topics" | "matchmaking" | "game" | "profile" | "leaderboard" | "friends" | "challenges";

/**
 * Game phase for UI state management
 */
export type GamePhase = 'connecting' | 'waiting' | 'ready' | 'playing' | 'answered' | 'complete';

// Import PlayerData to use in MatchData
import type { PlayerData } from '@/lib/socket/events';

/**
 * Extended PlayerData with Flair
 */
export interface PlayerDataWithFlair extends PlayerData {
  activeFlair?: any | null
}
