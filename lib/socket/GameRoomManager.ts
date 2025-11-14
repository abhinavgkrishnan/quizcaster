/**
 * GameRoomManager
 * Manages all active game rooms
 * Singleton pattern - one manager per server instance
 */

import { Server } from 'socket.io';
import { GameRoom } from './GameRoom';
import { supabase } from '@/lib/utils/supabase';
import { getGameState } from '@/lib/redis/game-state';
import { shuffleArray } from '@/lib/utils/shuffle';
import { GAME_CONFIG } from '@/lib/constants';
import type { PlayerData, Question } from './events';

export class GameRoomManager {
  private io: Server;
  private rooms: Map<string, GameRoom>; // matchId → GameRoom
  private roomCreationPromises: Map<string, Promise<GameRoom | null>>; // Track in-progress creations
  private rematchRequests: Map<string, { players: Set<number>; topic: string; timer: NodeJS.Timeout }>; // matchId → rematch data

  constructor(io: Server) {
    this.io = io;
    this.rooms = new Map();
    this.roomCreationPromises = new Map();
    this.rematchRequests = new Map();
  }

  /**
   * Create or get existing game room (with concurrency protection)
   */
  async getOrCreateRoom(matchId: string): Promise<GameRoom | null> {
    // Return existing room
    if (this.rooms.has(matchId)) {
      return this.rooms.get(matchId)!;
    }

    // If room is being created, wait for it
    if (this.roomCreationPromises.has(matchId)) {
      return this.roomCreationPromises.get(matchId)!;
    }

    // Create promise for room creation and store it
    const creationPromise = (async () => {
      try {

        // Get game state from Redis
        const gameState = await getGameState(matchId);

        if (!gameState) {
          console.error('[GameRoomManager] Game state not found in Redis:', matchId);
          this.roomCreationPromises.delete(matchId);
          return null;
        }

        // Fetch match to get topic
        const { data: match } = await supabase
          .from('matches')
          .select('topic')
          .eq('id', matchId)
          .single();

        if (!match) {
          console.error('[GameRoomManager] Match not found');
          this.roomCreationPromises.delete(matchId);
          return null;
        }

        const topic = match.topic;

        // Fetch player data
        const { data: players } = await supabase
          .from('users')
          .select('fid, username, display_name, pfp_url, active_flair')
          .in('fid', [gameState.player1_fid, gameState.player2_fid]);

        if (!players || players.length < 2) {
          console.error('[GameRoomManager] Players not found');
          this.roomCreationPromises.delete(matchId);
          return null;
        }

        const player1Data: PlayerData = {
          fid: players[0].fid,
          username: players[0].username,
          displayName: players[0].display_name,
          pfpUrl: players[0].pfp_url || undefined,
          activeFlair: players[0].active_flair || undefined,
        };

        const player2Data: PlayerData = {
          fid: players[1].fid,
          username: players[1].username,
          displayName: players[1].display_name,
          pfpUrl: players[1].pfp_url || undefined,
          activeFlair: players[1].active_flair || undefined,
        };

        // Fetch questions with correct answers
        const { data: questionsData } = await supabase
          .from('questions')
          .select('id, question, options, image_url, correct_answer')
          .in('id', gameState.questions);

        if (!questionsData || questionsData.length === 0) {
          console.error('[GameRoomManager] Questions not found');
          this.roomCreationPromises.delete(matchId);
          return null;
        }

        // Preserve question order from gameState
        const orderedQuestions = gameState.questions
          .map((qid: string) => questionsData.find((q: any) => q.id === qid))
          .filter((q): q is NonNullable<typeof q> => q !== undefined);

        // Store correct answers BEFORE shuffling (server-side only)
        const correctAnswers = new Map(
          orderedQuestions.map((q: any) => [q.id, q.correct_answer])
        );

        // Format questions with SHUFFLED options (hide correct answer position from client)
        const questions: Question[] = orderedQuestions.map((q: any) => {
          // Parse options if needed
          const options = Array.isArray(q.options) ? q.options : [];

          return {
            id: q.id,
            question: q.question,
            options: shuffleArray(options), // Shuffle so correct answer isn't always first
            imageUrl: q.image_url,
          };
        });

        // Create room with correct answers
        const room = new GameRoom(
          matchId,
          this.io,
          player1Data,
          player2Data,
          questions,
          gameState.questions,
          correctAnswers,
          topic
        );

        this.rooms.set(matchId, room);
        this.roomCreationPromises.delete(matchId);

        return room;
      } catch (error) {
        console.error('[GameRoomManager] Error creating room:', error);
        this.roomCreationPromises.delete(matchId);
        return null;
      }
    })();

    this.roomCreationPromises.set(matchId, creationPromise);
    return creationPromise;
  }

  /**
   * Get existing room
   */
  getRoom(matchId: string): GameRoom | null {
    return this.rooms.get(matchId) || null;
  }

  /**
   * Remove room (cleanup after game)
   */
  removeRoom(matchId: string): void {
    const room = this.rooms.get(matchId);
    if (room) {
      room.cleanup();
      this.rooms.delete(matchId);
    }
  }

  /**
   * Get all active rooms (for monitoring)
   */
  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Handle rematch request
   */
  async handleRematchRequest(matchId: string, fid: number, topic: string, player1Data: PlayerData, player2Data: PlayerData): Promise<void> {
    // Initialize rematch request if doesn't exist
    if (!this.rematchRequests.has(matchId)) {
      this.rematchRequests.set(matchId, {
        players: new Set([fid]),
        topic,
        timer: setTimeout(() => {
          // Expire after 10 seconds
          const matchKey = matchId;
          this.io.to(matchId).emit('rematch_expired');
          this.rematchRequests.delete(matchKey);
        }, 10000),
      });

      // Notify opponent that player requested rematch
      this.io.to(matchId).emit('rematch_requested', {
        fid,
        username: fid === player1Data.fid ? player1Data.username : player2Data.username,
      });
    } else {
      // Second player accepted!
      const request = this.rematchRequests.get(matchId)!;
      request.players.add(fid);

      // Both players accepted - create new match!
      if (request.players.size === 2) {
        clearTimeout(request.timer);
        this.rematchRequests.delete(matchId);

        // Create new match in database
        const { data: questionsData } = await supabase
          .from('questions')
          .select('id')
          .eq('topic', topic)
          .eq('is_active', true);

        if (!questionsData || questionsData.length < GAME_CONFIG.QUESTIONS_PER_MATCH) {
          this.io.to(matchId).emit('error', { message: 'Not enough questions available' });
          return;
        }

        // Shuffle and pick questions
        const shuffled = questionsData.sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, GAME_CONFIG.QUESTIONS_PER_MATCH);
        const questionIds = selectedQuestions.map(q => q.id);

        // Create match in database
        const { data: newMatch, error: matchError } = await supabase
          .from('matches')
          .insert({
            match_type: 'realtime',
            topic,
            player1_fid: player1Data.fid,
            player2_fid: player2Data.fid,
            status: 'in_progress',
            questions_used: questionIds,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (matchError || !newMatch) {
          this.io.to(matchId).emit('error', { message: 'Failed to create rematch' });
          return;
        }

        const newMatchId = newMatch.id;

        // Create Redis session
        const { createGameSession } = await import('@/lib/redis/game-state');
        await createGameSession(newMatchId, player1Data.fid, player2Data.fid, questionIds);

        // Notify both players
        this.io.to(matchId).emit('rematch_ready', { matchId: newMatchId });
      }
    }
  }

  /**
   * Cleanup all rooms (on server shutdown)
   */
  cleanup(): void {
    for (const room of this.rooms.values()) {
      room.cleanup();
    }
    this.rooms.clear();

    // Clear all rematch timers
    for (const request of this.rematchRequests.values()) {
      clearTimeout(request.timer);
    }
    this.rematchRequests.clear();
  }
}
