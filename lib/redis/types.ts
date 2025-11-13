/**
 * TypeScript types for Redis data structures
 */

export interface MatchmakingPlayer {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  skillLevel: number;
  joinedAt: number;
}

export interface GameState {
  player1_fid: number;
  player2_fid: number;
  player1_score: number;
  player2_score: number;
  current_question: number;
  questions: string[]; // Array of question IDs
  started_at: number;
  status: 'active' | 'completed' | 'abandoned';
  player1_completed?: boolean;
  player2_completed?: boolean;
}

export interface PlayerAnswer {
  question_id: string;
  question_number: number;
  answer: string;
  is_correct: boolean;
  time_taken_ms: number;
  points_earned: number;
  timestamp: number;
}

export interface MatchResult {
  match_id: string;
  player1_fid: number;
  player2_fid: number;
  player1_score: number;
  player2_score: number;
  winner_fid: number | null;
  answers: {
    player1: PlayerAnswer[];
    player2: PlayerAnswer[];
  };
}

export interface OnlinePlayer {
  fid: number;
  last_seen: number;
  current_match_id?: string;
}
