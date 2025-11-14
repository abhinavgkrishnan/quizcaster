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

/**
 * Extended User with Flairs
 */
export interface UserWithFlair extends FarcasterUser {
  earned_flairs?: any[]
  active_flair?: any | null
}

/**
 * Extended User Stats with Top Topics
 */
export interface UserStatsExtended {
  overall: {
    total_matches: number
    total_wins: number
    total_losses: number
    total_draws: number
    win_rate: string
    accuracy: string
    avg_response_time_s: string
    current_streak: number
    longest_streak: number
  }
  by_topic?: Record<string, {
    matches_played: number
    matches_won: number
    matches_lost: number
    matches_drawn: number
    win_rate: string
    total_points: number
    questions_answered: number
    questions_correct: number
    accuracy: string
    avg_response_time_s: string
    best_streak: number
  }>
  top_topics?: Array<{
    topic: string
    matches_played: number
    matches_won: number
  }>
}
