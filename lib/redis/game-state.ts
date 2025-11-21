/**
 * Redis Game State Management
 * Handles active game state in Redis for fast access
 */

import { getRedis } from './client';
import { GAME_CONFIG } from '@/lib/constants';
import type { GameState, PlayerAnswer } from './types';

/**
 * Create a new game session in Redis
 * For async matches, preserves existing completion flags if session already exists
 */
export async function createGameSession(
  matchId: string,
  player1Fid: number,
  player2Fid: number,
  questionIds: string[]
): Promise<void> {
  const redis = await getRedis();
  const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`;

  // Check if session already exists
  const existingState = await redis.hGetAll(gameKey);
  const sessionExists = existingState && Object.keys(existingState).length > 0;

  const gameState: Record<string, string | number> = {
    player1_fid: player1Fid,
    player2_fid: player2Fid,
    // Preserve scores if session already exists (for async matches)
    player1_score: sessionExists ? (parseInt(existingState.player1_score) || 0) : 0,
    player2_score: sessionExists ? (parseInt(existingState.player2_score) || 0) : 0,
    current_question: 1,
    questions: JSON.stringify(questionIds),
    started_at: sessionExists ? existingState.started_at : Date.now(),
    status: 'active',
    // Preserve completion flags if session already exists (for async matches)
    player1_completed: sessionExists ? (existingState.player1_completed || 0) : 0,
    player2_completed: sessionExists ? (existingState.player2_completed || 0) : 0,
  };

  if (sessionExists) {
    console.log('[Redis] Session exists, preserving state:', {
      player1_score: gameState.player1_score,
      player2_score: gameState.player2_score,
      player1_completed: gameState.player1_completed,
      player2_completed: gameState.player2_completed
    });
  }

  await redis.hSet(gameKey, gameState);
  await redis.expire(gameKey, GAME_CONFIG.MATCH_TTL);
}

/**
 * Get game state from Redis
 */
export async function getGameState(matchId: string): Promise<GameState | null> {
  const redis = await getRedis();
  const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`;

  const data = await redis.hGetAll(gameKey);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return {
    player1_fid: parseInt(data.player1_fid),
    player2_fid: parseInt(data.player2_fid),
    player1_score: parseInt(data.player1_score),
    player2_score: parseInt(data.player2_score),
    current_question: parseInt(data.current_question),
    questions: JSON.parse(data.questions),
    started_at: parseInt(data.started_at),
    status: data.status as 'active' | 'completed' | 'abandoned',
    player1_completed: data.player1_completed === '1',
    player2_completed: data.player2_completed === '1',
  };
}

/**
 * Update player score in game state
 */
export async function updatePlayerScore(
  matchId: string,
  fid: number,
  points: number
): Promise<{ playerScore: number; opponentScore: number; isPlayer1: boolean }> {
  const redis = await getRedis();
  const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`;

  // Get player positions
  const player1Fid = parseInt(await redis.hGet(gameKey, 'player1_fid') || '0');
  const isPlayer1 = fid === player1Fid;
  const scoreKey = isPlayer1 ? 'player1_score' : 'player2_score';

  // Increment score
  const newScore = await redis.hIncrBy(gameKey, scoreKey, points);

  // Get opponent score
  const opponentScoreKey = isPlayer1 ? 'player2_score' : 'player1_score';
  const opponentScore = parseInt(await redis.hGet(gameKey, opponentScoreKey) || '0');

  return {
    playerScore: newScore,
    opponentScore,
    isPlayer1,
  };
}

/**
 * Save player answer to Redis (temporary storage)
 */
export async function savePlayerAnswer(
  matchId: string,
  fid: number,
  answerData: PlayerAnswer
): Promise<void> {
  const redis = await getRedis();
  const answerKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}:${GAME_CONFIG.REDIS_PREFIX.ANSWERS}${fid}`;

  await redis.rPush(answerKey, JSON.stringify(answerData));
  await redis.expire(answerKey, GAME_CONFIG.ANSWER_TTL);
}

/**
 * Get all answers for a player
 */
export async function getPlayerAnswers(
  matchId: string,
  fid: number
): Promise<PlayerAnswer[]> {
  const redis = await getRedis();
  const answerKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}:${GAME_CONFIG.REDIS_PREFIX.ANSWERS}${fid}`;

  const answersJson = await redis.lRange(answerKey, 0, -1);

  return answersJson.map((json) => JSON.parse(json));
}

/**
 * Mark player as completed
 */
export async function markPlayerCompleted(
  matchId: string,
  fid: number
): Promise<{ bothCompleted: boolean; isPlayer1: boolean }> {
  const redis = await getRedis();
  const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`;

  // Get player positions
  const player1Fid = parseInt(await redis.hGet(gameKey, 'player1_fid') || '0');
  const isPlayer1 = fid === player1Fid;
  const completedKey = isPlayer1 ? 'player1_completed' : 'player2_completed';

  // Mark as completed
  await redis.hSet(gameKey, completedKey, 1);

  // Check if both completed
  const player1Completed = await redis.hGet(gameKey, 'player1_completed');
  const player2Completed = await redis.hGet(gameKey, 'player2_completed');
  const bothCompleted = player1Completed === '1' && player2Completed === '1';

  return { bothCompleted, isPlayer1 };
}

/**
 * Delete game session from Redis (cleanup after saving to Postgres)
 */
export async function deleteGameSession(matchId: string): Promise<void> {
  const redis = await getRedis();
  const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`;

  // Get game state to find player FIDs
  const gameState = await getGameState(matchId);

  if (gameState) {
    // Delete game state
    await redis.del(gameKey);

    // Delete player answers
    const answer1Key = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}:${GAME_CONFIG.REDIS_PREFIX.ANSWERS}${gameState.player1_fid}`;
    const answer2Key = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}:${GAME_CONFIG.REDIS_PREFIX.ANSWERS}${gameState.player2_fid}`;

    await redis.del(answer1Key);
    await redis.del(answer2Key);
  } else {
    // Just try to delete the game key
    await redis.del(gameKey);
  }
}

/**
 * Get questions for a match
 */
export async function getMatchQuestions(matchId: string): Promise<string[]> {
  const redis = await getRedis();
  const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`;

  const questionsJson = await redis.hGet(gameKey, 'questions');

  if (!questionsJson) {
    return [];
  }

  return JSON.parse(questionsJson);
}

/**
 * Check if game session exists
 */
export async function gameSessionExists(matchId: string): Promise<boolean> {
  const redis = await getRedis();
  const gameKey = `${GAME_CONFIG.REDIS_PREFIX.GAME}${matchId}`;

  const exists = await redis.exists(gameKey);
  return exists === 1;
}
