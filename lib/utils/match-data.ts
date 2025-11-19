/**
 * Match Data Utilities
 * Unified functions for match answer insertion, score calculation, and finalization
 */

import { supabase } from './supabase'
import type { TablesInsert } from '@/lib/database.types'

/**
 * Save match answers to the database in a batch operation
 * @param matchId - ID of the match
 * @param answers - Array of answers to save
 * @returns Success boolean and error if any
 */
export async function saveMatchAnswers(
  matchId: string,
  answers: Array<{
    fid: number
    question_id: string
    question_number: number
    answer: string
    is_correct: boolean
    time_taken_ms: number
    points_earned: number
    timestamp: number
  }>
): Promise<{ success: boolean; error?: any }> {
  if (answers.length === 0) {
    return { success: true }
  }

  try {
    // Format answers for database insertion
    const answersToInsert: TablesInsert<'match_answers'>[] = answers.map(a => ({
      match_id: matchId,
      fid: a.fid,
      question_id: a.question_id,
      question_number: a.question_number,
      answer_given: a.answer,
      is_correct: a.is_correct,
      time_taken_ms: a.time_taken_ms,
      points_earned: a.points_earned,
      answered_at: new Date(a.timestamp).toISOString(),
    }))

    // Batch insert all answers
    const { error } = await supabase
      .from('match_answers')
      .insert(answersToInsert)

    if (error) {
      console.error('[Match Data] Error saving answers:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('[Match Data] Exception saving answers:', error)
    return { success: false, error }
  }
}

/**
 * Calculate total score from an array of answers
 * @param answers - Array of answers with points_earned
 * @returns Total score
 */
export function calculateScoreFromAnswers(
  answers: Array<{ points_earned: number }>
): number {
  return answers.reduce((sum, a) => sum + a.points_earned, 0)
}

/**
 * Finalize a match - update status, winner, scores, and completion timestamp
 * NOTE: This triggers the database trigger that auto-updates user stats
 *
 * @param matchId - ID of the match
 * @param winnerFid - FID of the winner (null for draw)
 * @param player1Score - Score of player 1
 * @param player2Score - Score of player 2
 * @param forfeitedBy - FID of player who forfeited (if any)
 * @returns Success boolean and error if any
 */
export async function finalizeMatch(
  matchId: string,
  winnerFid: number | null,
  player1Score: number,
  player2Score: number,
  forfeitedBy?: number | null
): Promise<{ success: boolean; error?: any }> {
  try {
    const updateData: any = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      winner_fid: winnerFid,
      player1_score: player1Score,
      player2_score: player2Score,
    }

    // Add forfeit info if applicable
    if (forfeitedBy !== null && forfeitedBy !== undefined) {
      updateData.forfeited_by = forfeitedBy
    }

    // Update match status
    // IMPORTANT: This triggers the database trigger `update_user_stats_on_match_complete()`
    // which automatically updates user_stats_overall and user_stats_by_topic
    const { error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)

    if (error) {
      console.error('[Match Data] Error finalizing match:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('[Match Data] Exception finalizing match:', error)
    return { success: false, error }
  }
}

/**
 * Update match scores without finalizing
 * Used for async matches when one player completes but match isn't finished yet
 *
 * @param matchId - ID of the match
 * @param player1Score - Score of player 1 (undefined to skip update)
 * @param player2Score - Score of player 2 (undefined to skip update)
 * @param player1CompletedAt - Completion timestamp for player 1 (undefined to skip update)
 * @param player2CompletedAt - Completion timestamp for player 2 (undefined to skip update)
 * @returns Success boolean and error if any
 */
export async function updateMatchScores(
  matchId: string,
  player1Score?: number,
  player2Score?: number,
  player1CompletedAt?: string,
  player2CompletedAt?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const updateData: any = {}

    if (player1Score !== undefined) updateData.player1_score = player1Score
    if (player2Score !== undefined) updateData.player2_score = player2Score
    if (player1CompletedAt !== undefined) updateData.player1_completed_at = player1CompletedAt
    if (player2CompletedAt !== undefined) updateData.player2_completed_at = player2CompletedAt

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return { success: true }
    }

    const { error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)

    if (error) {
      console.error('[Match Data] Error updating match scores:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('[Match Data] Exception updating match scores:', error)
    return { success: false, error }
  }
}

/**
 * Get scores for both players from database answers
 * Useful for async matches where we need to recalculate from stored answers
 *
 * @param matchId - ID of the match
 * @param player1Fid - FID of player 1
 * @param player2Fid - FID of player 2
 * @returns Object with player1Score and player2Score
 */
export async function getScoresFromAnswers(
  matchId: string,
  player1Fid: number,
  player2Fid: number
): Promise<{ player1Score: number; player2Score: number; error?: any }> {
  try {
    const { data: answers, error } = await supabase
      .from('match_answers')
      .select('fid, points_earned')
      .eq('match_id', matchId)

    if (error) {
      console.error('[Match Data] Error fetching answers for score calculation:', error)
      return { player1Score: 0, player2Score: 0, error }
    }

    const player1Score = answers
      ?.filter(a => a.fid === player1Fid)
      .reduce((sum, a) => sum + a.points_earned, 0) || 0

    const player2Score = answers
      ?.filter(a => a.fid === player2Fid)
      .reduce((sum, a) => sum + a.points_earned, 0) || 0

    return { player1Score, player2Score }
  } catch (error) {
    console.error('[Match Data] Exception getting scores from answers:', error)
    return { player1Score: 0, player2Score: 0, error }
  }
}

/**
 * Update async challenge status
 * @param matchId - ID of the match
 * @param status - New status for the challenge
 * @returns Success boolean and error if any
 */
export async function updateChallengeStatus(
  matchId: string,
  status: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('async_challenges')
      .update({ status })
      .eq('match_id', matchId)

    if (error) {
      console.error('[Match Data] Error updating challenge status:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('[Match Data] Exception updating challenge status:', error)
    return { success: false, error }
  }
}
