/**
 * Socket.IO Event Definitions
 * Shared types for client-server communication
 */

export interface PlayerData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
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
  }) => void;

  // Connection status
  opponent_joined: (data: PlayerData) => void;
  opponent_left: (data: { fid: number }) => void;

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
