/**
 * User-related Types
 * Central definitions for user and authentication data
 */

/**
 * Farcaster user data structure
 */
export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
}

/**
 * User statistics structure
 */
export interface UserStats {
  total_matches: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  total_points: number;
  total_questions: number;
  total_correct: number;
  avg_response_time_ms: number | null;
  longest_streak: number;
  global_rank: number | null;
}
