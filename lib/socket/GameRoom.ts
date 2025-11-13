/**
 * GameRoom Class
 * Server-authoritative game logic for a single match
 * Controls questions, timer, scoring, and broadcasts all events
 */

import { Server, Socket } from 'socket.io';
import { supabase } from '@/lib/utils/supabase';
import { calculatePoints } from '@/lib/utils/scoring';
import { updateUserStatsAfterMatch } from '@/lib/utils/stats';
import { getGameState, updatePlayerScore, savePlayerAnswer, markPlayerCompleted, getPlayerAnswers, deleteGameSession } from '@/lib/redis/game-state';
import { GAME_CONFIG, SCORING } from '@/lib/constants';
import type { PlayerData, Question, PlayerScore, ServerToClientEvents } from './events';
import type { TablesInsert } from '@/lib/database.types';

export class GameRoom {
  private matchId: string;
  private io: Server;
  private players: Map<number, PlayerData>; // fid → PlayerData
  private sockets: Map<number, Socket>; // fid → Socket
  private questions: Question[];
  private questionIds: string[]; // Original question IDs for DB storage
  private currentQuestionIndex: number = 0;
  private scores: Map<number, number>; // fid → score
  private answers: Map<number, any[]>; // fid → array of answers
  private timer: NodeJS.Timeout | null = null;
  private timeRemaining: number = 0;
  private questionStartTime: number = 0;
  private playersReady: Set<number>; // FIDs that are ready
  private playersAnsweredCurrentQuestion: Set<number>; // FIDs that answered current question
  private questionEnded: boolean = false; // Prevent multiple endQuestion calls
  private correctAnswers: Map<string, string>; // questionId → correct answer
  private playerStreaks: Map<number, number>; // fid → current streak of correct answers
  private topic: string;

  constructor(
    matchId: string,
    io: Server,
    player1: PlayerData,
    player2: PlayerData,
    questions: Question[],
    questionIds: string[],
    correctAnswers: Map<string, string>,
    topic: string
  ) {
    this.matchId = matchId;
    this.io = io;
    this.players = new Map([
      [player1.fid, player1],
      [player2.fid, player2],
    ]);
    this.sockets = new Map();
    this.questions = questions;
    this.questionIds = questionIds;
    this.scores = new Map([
      [player1.fid, 0],
      [player2.fid, 0],
    ]);
    this.answers = new Map([
      [player1.fid, []],
      [player2.fid, []],
    ]);
    this.playersReady = new Set();
    this.playersAnsweredCurrentQuestion = new Set();
    this.correctAnswers = correctAnswers;
    this.playerStreaks = new Map([
      [player1.fid, 0],
      [player2.fid, 0],
    ]);
    this.topic = topic;
  }

  /**
   * Add a player's socket to the room
   */
  addPlayer(fid: number, socket: Socket): void {
    this.sockets.set(fid, socket);
    socket.join(this.matchId);

    // Notify other player
    const player = this.players.get(fid);
    if (player) {
      socket.to(this.matchId).emit('opponent_joined', player);
    }
  }

  /**
   * Mark player as ready to start
   */
  markPlayerReady(fid: number): void {
    this.playersReady.add(fid);

    // Start game when both players ready
    if (this.playersReady.size === this.players.size) {
      setTimeout(() => this.startGame(), 1000);
    }
  }

  /**
   * Start the game
   */
  private startGame(): void {

    this.io.to(this.matchId).emit('game_ready', {
      matchId: this.matchId,
      players: Array.from(this.players.values()),
      totalQuestions: this.questions.length,
    });

    // Start first question after brief delay (reduced from 2s to 1s)
    setTimeout(() => this.startQuestion(), 1000);
  }

  /**
   * Start a question
   */
  private startQuestion(): void {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    this.timeRemaining = GAME_CONFIG.QUESTION_TIME_LIMIT;
    this.playersAnsweredCurrentQuestion.clear(); // Reset for new question
    this.questionEnded = false; // Reset end flag

    // Check if this is the final question
    const isFinalQuestion = (this.currentQuestionIndex + 1) === this.questions.length;

    // Broadcast question to all players with current scores
    this.io.to(this.matchId).emit('question_start', {
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.questions.length,
      question,
      timeLimit: GAME_CONFIG.QUESTION_TIME_LIMIT,
      scores: this.getScores(), // Show scores from previous questions
      isFinalQuestion,
    });

    // Wait for OPTIONS_LOAD_DELAY + buffer before starting timer
    // This ensures timer only starts AFTER options are visible to players
    const timerStartDelay = GAME_CONFIG.OPTIONS_LOAD_DELAY + GAME_CONFIG.TIMER_START_BUFFER;
    setTimeout(() => {
      // Set questionStartTime HERE (when timer actually starts, not when question broadcasts)
      this.questionStartTime = Date.now();

      // Only start timer if question hasn't ended yet
      if (!this.questionEnded) {
        this.startTimer();
      }
    }, timerStartDelay);
  }

  /**
   * Server-controlled timer (broadcasts every second)
   */
  private startTimer(): void {
    this.timer = setInterval(() => {
      this.timeRemaining--;

      // Stop at 0, don't go negative
      if (this.timeRemaining < 0) {
        this.timeRemaining = 0;
      }

      // Broadcast tick to all players
      this.io.to(this.matchId).emit('timer_tick', {
        remaining: this.timeRemaining,
      });

      // End question when time runs out
      if (this.timeRemaining <= 0) {
        this.endQuestion();
      }
    }, 1000);
  }

  /**
   * Handle player answer submission
   */
  handleAnswer(fid: number, answer: string, clientTimestamp: number): void {
    // Prevent duplicate answers from same player for current question
    if (this.playersAnsweredCurrentQuestion.has(fid)) {
      return;
    }

    const currentQuestion = this.questions[this.currentQuestionIndex];
    const questionId = this.questionIds[this.currentQuestionIndex];

    // Calculate time taken (server-side for anti-cheat)
    const serverTimeTaken = Date.now() - this.questionStartTime;
    const timeTaken = Math.min(serverTimeTaken, GAME_CONFIG.QUESTION_TIME_LIMIT * 1000);

    // Validate answer (server-side)
    const isCorrect = this.validateAnswer(answer, currentQuestion);

    // Check if this is the final question (2x points!)
    const isFinalQuestion = (this.currentQuestionIndex + 1) === this.questions.length;
    const multiplier = isFinalQuestion ? SCORING.FINAL_QUESTION_MULTIPLIER : 1;

    const points = isCorrect ? calculatePoints(timeTaken, multiplier) : 0;

    // Update score
    const currentScore = this.scores.get(fid) || 0;
    const newScore = currentScore + points;
    this.scores.set(fid, newScore);

    // Store answer for DB
    this.answers.get(fid)?.push({
      question_id: questionId,
      question_number: this.currentQuestionIndex + 1,
      answer,
      is_correct: isCorrect,
      time_taken_ms: timeTaken,
      points_earned: points,
      timestamp: Date.now(),
    });

    // Mark player as answered for current question
    this.playersAnsweredCurrentQuestion.add(fid);

    // Broadcast result to ALL players (instant feedback)
    const scores = this.getScores();
    this.io.to(this.matchId).emit('player_answered', {
      fid,
      isCorrect,
      points,
      scores,
    });

    // If all players have answered, end question immediately
    if (this.playersAnsweredCurrentQuestion.size === this.players.size) {
      this.endQuestion();
    }
  }

  /**
   * Validate answer against correct answer (server-side)
   */
  private validateAnswer(playerAnswer: string, question: Question): boolean {
    const questionId = this.questionIds[this.currentQuestionIndex];
    const correctAnswer = this.correctAnswers.get(questionId);

    if (!correctAnswer) {
      console.error('[GameRoom] Correct answer not found for question:', questionId);
      return false;
    }

    // Case-insensitive comparison
    return playerAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  }

  /**
   * End current question
   */
  private endQuestion(): void {
    // Prevent multiple calls
    if (this.questionEnded) {
      return;
    }
    this.questionEnded = true;

    // Stop timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Get correct answer from map
    const questionId = this.questionIds[this.currentQuestionIndex];
    const correctAnswer = this.correctAnswers.get(questionId) || 'Unknown';

    // Broadcast question end with correct answer
    this.io.to(this.matchId).emit('question_end', {
      correctAnswer,
      scores: this.getScores(),
    });

    // Move to next question after brief delay (reduced from 2s to 1s)
    setTimeout(() => {
      this.currentQuestionIndex++;

      if (this.currentQuestionIndex < this.questions.length) {
        this.io.to(this.matchId).emit('next_question', { delay: 1000 });
        setTimeout(() => this.startQuestion(), 1000);
      } else {
        this.endGame();
      }
    }, 1000);
  }

  /**
   * End game and save results
   */
  private async endGame(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const scores = this.getScores();
    const [score1, score2] = scores;
    const winnerFid = score1.score > score2.score ? score1.fid : score2.score > score1.score ? score2.fid : null;

    // Broadcast game complete
    this.io.to(this.matchId).emit('game_complete', {
      winnerFid,
      finalScores: scores,
      isDraw: winnerFid === null,
    });

    // Save to database
    await this.saveToDatabase();
  }

  /**
   * Save game results to Postgres
   */
  private async saveToDatabase(): Promise<void> {
    try {
      // Collect all answers
      const allAnswers: TablesInsert<'match_answers'>[] = [];

      for (const [fid, answersList] of this.answers.entries()) {
        for (const answer of answersList) {
          allAnswers.push({
            match_id: this.matchId,
            fid,
            question_id: answer.question_id,
            question_number: answer.question_number,
            answer_given: answer.answer, // Map 'answer' to 'answer_given'
            is_correct: answer.is_correct,
            time_taken_ms: answer.time_taken_ms,
            points_earned: answer.points_earned,
            answered_at: new Date(answer.timestamp).toISOString(),
          });
        }
      }

      // Batch insert
      if (allAnswers.length > 0) {
        const { error } = await supabase.from('match_answers').insert(allAnswers);
        if (error) console.error('[GameRoom] Error saving answers:', error);
      }

      // Update match status
      const scores = this.getScores();
      const winnerFid = scores[0].score > scores[1].score ? scores[0].fid : scores[1].score > scores[0].score ? scores[1].fid : null;

      const { error: matchUpdateError } = await supabase.from('matches').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        winner_fid: winnerFid,
        player1_score: scores.find(s => s.fid === Array.from(this.players.keys())[0])?.score || 0,
        player2_score: scores.find(s => s.fid === Array.from(this.players.keys())[1])?.score || 0,
      }).eq('id', this.matchId);

      if (matchUpdateError) {
        console.error('[GameRoom] Error updating match status:', matchUpdateError);
      }

      // Update user stats (including streaks)
      const [player1Fid, player2Fid] = Array.from(this.players.keys());
      await updateUserStatsAfterMatch({
        matchId: this.matchId,
        topic: this.topic,
        player1Fid,
        player2Fid,
        player1Score: scores.find(s => s.fid === player1Fid)?.score || 0,
        player2Score: scores.find(s => s.fid === player2Fid)?.score || 0,
        winnerFid,
        player1Answers: this.answers.get(player1Fid) || [],
        player2Answers: this.answers.get(player2Fid) || [],
      });

      // Cleanup Redis
      await deleteGameSession(this.matchId);
    } catch (error) {
      console.error('[GameRoom] Database save error:', error);
    }
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(fid: number): void {
    this.sockets.delete(fid);

    // Notify other player
    this.io.to(this.matchId).emit('opponent_left', { fid });

    // TODO: Handle bot takeover or forfeit
  }

  /**
   * Get current scores as array
   */
  private getScores(): PlayerScore[] {
    return Array.from(this.players.entries()).map(([fid, player]) => ({
      fid,
      score: this.scores.get(fid) || 0,
      username: player.username,
      displayName: player.displayName,
    }));
  }

  /**
   * Get players (for rematch)
   */
  getPlayers() {
    return this.players;
  }

  /**
   * Cleanup room
   */
  cleanup(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Remove all sockets from room
    for (const socket of this.sockets.values()) {
      socket.leave(this.matchId);
    }
  }
}
