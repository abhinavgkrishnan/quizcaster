/**
 * useSocketGame Hook
 * Client-side Socket.IO game manager
 * Connects to server, receives events, manages local UI state
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/socket/events';
import type { PlayerData, GamePhase } from '@/lib/types';

interface Question {
  id: string
  question: string
  options: string[]
  image_url?: string | null
}

interface PlayerScore {
  fid: number
  score: number
  answers: number
  correct: number
}

interface GameState {
  phase: GamePhase;
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  myScore: number;
  opponentScore: number;
  opponentOnline: boolean;
  isFinalQuestion: boolean;
  correctAnswer: string | null;
  lastAnswerResult: {
    fid: number;
    isCorrect: boolean;
    points: number;
  } | null;
  myAnswers: Array<{
    isCorrect: boolean;
    timeTaken: number;
    points: number;
  }>;
  winner: number | null;
  error: string | null;
  opponentRequestedRematch: boolean;
  rematchReady: string | null;
  forfeitedBy: number | null;
}

export function useSocketGame(
  matchId: string,
  myPlayer: PlayerData,
  opponent: PlayerData,
  topic: string
) {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'connecting',
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 10,
    timeRemaining: 10,
    myScore: 0,
    opponentScore: 0,
    opponentOnline: false,
    isFinalQuestion: false,
    correctAnswer: null,
    lastAnswerResult: null,
    myAnswers: [],
    winner: null,
    error: null,
    opponentRequestedRematch: false,
    rematchReady: null,
    forfeitedBy: null,
  });

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // Connect to Socket.IO ONCE
  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: '/socket.io/',
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      // Join game room
      socket.emit('join_game', {
        matchId,
        player: myPlayer,
      });

      setGameState(prev => ({ ...prev, phase: 'waiting' }));
    });

    // Wait for join confirmation before marking ready
    socket.on('join_confirmed', ({ matchId: confirmedMatchId }) => {
      // Mark ready
      socket.emit('player_ready', {
        matchId,
        fid: myPlayer.fid,
      });
    });

    // Game ready
    socket.on('game_ready', (data) => {
      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        totalQuestions: data.totalQuestions,
      }));
    });

    // Question start
    socket.on('question_start', (data) => {
      questionStartTimeRef.current = Date.now(); // Track when question started

      // Update scores at START of new question (shows results from previous question)
      const myScore = data.scores.find(s => s.fid === myPlayer.fid)?.score || 0;
      const opponentScore = data.scores.find(s => s.fid === opponent.fid)?.score || 0;

      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentQuestion: data.question,
        questionNumber: data.questionNumber,
        timeRemaining: data.timeLimit,
        myScore,
        opponentScore,
        isFinalQuestion: data.isFinalQuestion,
        correctAnswer: null, // Clear previous correct answer
        lastAnswerResult: null, // Clear previous result
      }));
    });

    // Timer tick
    socket.on('timer_tick', (data) => {
      setGameState(prev => ({
        ...prev,
        timeRemaining: data.remaining,
      }));
    });

    // Player answered (could be me or opponent)
    socket.on('player_answered', (data) => {
      // If it's my answer, save result for feedback and track it
      const isMyAnswer = data.fid === myPlayer.fid;

      setGameState(prev => {
        const newAnswers = isMyAnswer ? [
          ...prev.myAnswers,
          {
            isCorrect: data.isCorrect,
            timeTaken: Date.now() - questionStartTimeRef.current,
            points: data.points,
          }
        ] : prev.myAnswers;

        return {
          ...prev,
          phase: isMyAnswer ? 'answered' : prev.phase,
          myAnswers: newAnswers,
          lastAnswerResult: isMyAnswer ? {
            fid: data.fid,
            isCorrect: data.isCorrect,
            points: data.points,
          } : prev.lastAnswerResult,
        };
      });
    });

    // Question end - capture correct answer for display
    socket.on('question_end', (data) => {
      setGameState(prev => ({ ...prev, correctAnswer: data.correctAnswer }));
    });

    // Next question
    socket.on('next_question', (data) => {
      // Will start next question after delay
    });

    // Game complete
    socket.on('game_complete', (data) => {

      // Update final scores
      const myScore = data.finalScores.find(s => s.fid === myPlayer.fid)?.score || 0;
      const opponentScore = data.finalScores.find(s => s.fid === opponent.fid)?.score || 0;

      setGameState(prev => ({
        ...prev,
        phase: 'complete',
        myScore,
        opponentScore,
        winner: data.winnerFid,
        forfeitedBy: data.forfeitedBy || null,
      }));
    });

    // Opponent status
    socket.on('opponent_joined', (data) => {
      setGameState(prev => ({ ...prev, opponentOnline: true }));
    });

    socket.on('opponent_left', (data) => {
      setGameState(prev => ({ ...prev, opponentOnline: false }));
    });

    // Errors
    socket.on('error', (data) => {
      console.error('[useSocketGame] Error:', data.message);
      setGameState(prev => ({ ...prev, error: data.message }));
    });

    // Rematch events
    socket.on('rematch_requested', (data) => {
      setGameState(prev => ({ ...prev, opponentRequestedRematch: true }));
    });

    socket.on('rematch_ready', (data) => {
      setGameState(prev => ({ ...prev, rematchReady: data.matchId }));
    });

    socket.on('rematch_expired', () => {
      setGameState(prev => ({ ...prev, opponentRequestedRematch: false }));
    });

    // Cleanup
    return () => {
      socket.emit('leave_game', { matchId, fid: myPlayer.fid });
      socket.disconnect();
    };
  }, [matchId, myPlayer.fid]); // Only reconnect if match/player changes

  // Submit answer (stable callback)
  const submitAnswer = useCallback((answer: string) => {
    if (!socketRef.current) return;

    const socket = socketRef.current;
    const questionId = gameState.currentQuestion?.id;

    if (!questionId) {
      console.error('[useSocketGame] No current question!');
      return;
    }

    socket.emit('submit_answer', {
      matchId,
      fid: myPlayer.fid,
      questionId,
      answer,
      clientTimestamp: Date.now(),
    });
  }, [matchId, myPlayer.fid, gameState.currentQuestion]);

  // Request rematch
  const requestRematch = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('request_rematch', {
      matchId,
      fid: myPlayer.fid,
      topic,
    });
  }, [matchId, myPlayer.fid, topic]);

  // Forfeit game
  const forfeitGame = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('forfeit_game', {
      matchId,
      fid: myPlayer.fid,
    });
  }, [matchId, myPlayer.fid]);

  return {
    // State
    ...gameState,

    // Actions
    submitAnswer,
    requestRematch,
    forfeitGame,

    // Computed
    isConnected: socketRef.current?.connected || false,
    isWaitingForOpponent: gameState.phase === 'waiting',
    isPlaying: gameState.phase === 'playing',
    isAnswered: gameState.phase === 'answered',
    isComplete: gameState.phase === 'complete',
  };
}
