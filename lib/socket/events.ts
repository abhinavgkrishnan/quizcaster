/**
 * Socket.IO Event Definitions
 * Shared types for client-server communication
 */

export interface PlayerData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  activeFlair?: any; // User's active flair/title
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  imageUrl?: string | null;
}

export interface PlayerScore {
  fid: number;
  score: number;
  username: string;
  displayName: string;
}

// ============================================================================
// Server → Client Events (Server emits these)
// ============================================================================

export interface ServerToClientEvents {
  // Connection
  join_confirmed: (data: {
    matchId: string;
  }) => void;

  // Game lifecycle
  game_ready: (data: {
    matchId: string;
    players: PlayerData[];
    totalQuestions: number;
  }) => void;

  // Question flow
  question_start: (data: {
    questionNumber: number;
    totalQuestions: number;
    question: Question;
    timeLimit: number;
    scores: PlayerScore[]; // Current scores at start of question
    isFinalQuestion: boolean; // Whether this is the last question (2x points)
  }) => void;

  timer_start: (data: {
    serverTime: number;
  }) => void;

  timer_tick: (data: {
    remaining: number;
  }) => void;

  // Answer feedback
  player_answered: (data: {
    fid: number;
    isCorrect: boolean;
    points: number;
    scores: PlayerScore[];
  }) => void;

  question_end: (data: {
    correctAnswer: string;
    scores: PlayerScore[];
  }) => void;

  // Progression
  next_question: (data: {
    delay: number; // milliseconds until next question
  }) => void;

  game_complete: (data: {
    winnerFid: number | null;
    finalScores: PlayerScore[];
    isDraw: boolean;
    forfeitedBy?: number | null; // FID of player who forfeited
    isAsync?: boolean; // Whether this is an async game
    challengeStatus?: 'pending' | 'completed'; // Status for async games
  }) => void;

  // Async game specific events
  async_emulation_start: (data: {
    challengerData: any; // Challenger's game session data
    questions: Question[];
  }) => void;

  async_emulation_answer: (data: {
    questionNumber: number;
    challengerAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
    points: number;
  }) => void;

  // Connection status
  opponent_joined: (data: PlayerData) => void;
  opponent_left: (data: { fid: number }) => void;

  // Rematch
  rematch_requested: (data: { fid: number; username: string }) => void;
  rematch_ready: (data: { matchId: string }) => void;
  rematch_expired: () => void;

  // Errors
  error: (data: { message: string }) => void;
}

// ============================================================================
// Client → Server Events (Client emits these)
// ============================================================================

export interface ClientToServerEvents {
  // Join/leave
  join_game: (data: {
    matchId: string;
    player: PlayerData;
  }) => void;

  player_ready: (data: {
    matchId: string;
    fid: number;
  }) => void;

  // Gameplay
  submit_answer: (data: {
    matchId: string;
    fid: number;
    questionId: string;
    answer: string;
    clientTimestamp: number; // For anti-cheat
  }) => void;

  // Graceful disconnect
  leave_game: (data: {
    matchId: string;
    fid: number;
  }) => void;

  // Rematch
  request_rematch: (data: {
    matchId: string;
    fid: number;
    topic: string;
  }) => void;

  // Forfeit
  forfeit_game: (data: {
    matchId: string;
    fid: number;
  }) => void;

  // Async game
  start_async_emulation: (data: {
    matchId: string;
    fid: number;
  }) => void;
}

// ============================================================================
// Inter-server Events (for scaling - future)
// ============================================================================

export interface InterServerEvents {
  ping: () => void;
}

// ============================================================================
// Socket Data (per socket)
// ============================================================================

export interface SocketData {
  matchId?: string;
  playerFid?: number;
  playerUsername?: string;
}
