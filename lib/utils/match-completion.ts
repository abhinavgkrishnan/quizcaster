/**
 * Unified Match Completion Handler
 * Consolidates logic for both live and async match completion
 *
 * Handles:
 * - Live matches: Both players complete → finalize immediately
 * - Async matches: Challenger → store data → Opponent → finalize
 * - Answer saving, score calculation, winner determination
 * - Database trigger for stats updates
 */

import { supabase } from './supabase'
import { getGameState, markPlayerCompleted, getPlayerAnswers, deleteGameSession } from '@/lib/redis/game-state'
import { broadcastGameComplete } from './realtime'
import { determineWinner } from './match-results'
import { saveMatchAnswers, finalizeMatch, updateMatchScores, updateChallengeStatus, getScoresFromAnswers } from './match-data'
import type { TablesInsert } from '@/lib/database.types'
import { TEXT } from '@/lib/constants/text'

interface CompletionOptions {
  /** ID of the match */
  matchId: string
  /** FID of the player completing */
  fid: number
  /** Whether this is an async challenge */
  isAsync?: boolean
}

interface CompletionResult {
  /** Whether both players have completed */
  bothCompleted: boolean
  /** Result for this player ('win'|'loss'|'draw') - only if bothCompleted */
  result?: 'win' | 'loss' | 'draw'
  /** This player's score */
  playerScore: number
  /** Opponent's score */
  opponentScore: number
  /** Winner's FID (null for draw) - only if bothCompleted */
  winnerFid?: number | null
  /** Whether waiting for opponent */
  waitingForOpponent?: boolean
}

/**
 * Complete a match for a player
 * Unified handler for both live and async match completion
 */
export async function completeMatchForPlayer({
  matchId,
  fid,
  isAsync = false
}: CompletionOptions): Promise<CompletionResult> {
  try {
    // Get match from database
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      throw new Error(`Match not found: ${matchId}`)
    }

    const isPlayer1 = match.player1_fid === fid

    // Get game state from Redis (might not exist for async if already cleaned up)
    const gameState = await getGameState(matchId)

    let bothCompleted = false
    let playerAnswers: any[] = []
    let score = 0

    // For async matches, ALWAYS use Postgres timestamps to determine completion
    // (Redis sessions can be overwritten when Player 2 starts playing)
    if (isAsync) {
      console.log('[Match Completion] Async match - using Postgres timestamps')

      // Try to get answers from Postgres first (primary source)
      const { data: answers } = await supabase
        .from('match_answers')
        .select('*')
        .eq('match_id', matchId)
        .eq('fid', fid)
        .order('question_number')

      playerAnswers = (answers || []).map(a => ({
        question_id: a.question_id,
        question_number: a.question_number,
        answer: a.answer_given,
        is_correct: a.is_correct,
        time_taken_ms: a.time_taken_ms,
        points_earned: a.points_earned,
        timestamp: new Date(a.answered_at).getTime()
      }))

      // FALLBACK: If no answers in Postgres but Redis session exists, try Redis
      // This handles edge cases where Postgres insert failed but Redis has data
      if (playerAnswers.length === 0 && gameState) {
        console.log('[Match Completion] No answers in Postgres, checking Redis as fallback')
        const redisAnswers = await getPlayerAnswers(matchId, fid)
        if (redisAnswers.length > 0) {
          playerAnswers = redisAnswers
          console.log('[Match Completion] Using Redis answers:', redisAnswers.length)
        }
      }

      score = playerAnswers.reduce((sum, a) => sum + a.points_earned, 0)

      // For async: Check if OTHER player already completed BEFORE we update this player
      const otherPlayerCompleted = isPlayer1 ? match.player2_completed_at : match.player1_completed_at
      bothCompleted = !!otherPlayerCompleted
    } else if (gameState) {
      // Live match with Redis session - use Redis completion flags
      const completionResult = await markPlayerCompleted(matchId, fid)
      bothCompleted = completionResult.bothCompleted
      playerAnswers = await getPlayerAnswers(matchId, fid)
      score = gameState.player1_fid === fid ? gameState.player1_score : gameState.player2_score
    } else {
      throw new Error('Live match without Redis session - this should not happen')
    }

    // Save this player's answers to Postgres (if not already saved)
    if (playerAnswers.length > 0) {
      const saveResult = await saveMatchAnswers(matchId, playerAnswers.map(a => ({
        ...a,
        fid
      })))

      // Ignore duplicate key errors (answers already saved)
      if (!saveResult.success && saveResult.error?.code !== '23505') {
        console.error('[Match Completion] Error saving answers:', saveResult.error)
      }
    }

    // Update match with this player's completion
    if (isPlayer1) {
      await updateMatchScores(
        matchId,
        score,
        undefined,
        new Date().toISOString(),
        undefined
      )
    } else {
      await updateMatchScores(
        matchId,
        undefined,
        score,
        undefined,
        new Date().toISOString()
      )
    }

    // For async matches, re-check if both completed after updating this player's timestamp
    if (isAsync) {
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('player1_completed_at, player2_completed_at')
        .eq('id', matchId)
        .single()

      // Both completed if BOTH timestamps exist
      bothCompleted = !!(updatedMatch?.player1_completed_at && updatedMatch?.player2_completed_at)
      console.log('[Match Completion] After update - bothCompleted:', bothCompleted, {
        player1_completed_at: updatedMatch?.player1_completed_at,
        player2_completed_at: updatedMatch?.player2_completed_at
      })
    }

    // Now both players are completed if bothCompleted is true
    if (bothCompleted) {
      // Get final scores
      let player1Score: number
      let player2Score: number

      if (isAsync) {
        // For async matches, always calculate from database answers
        const scores = await getScoresFromAnswers(matchId, match.player1_fid, match.player2_fid!)
        player1Score = scores.player1Score
        player2Score = scores.player2Score
        console.log('[Match Completion] Async scores from DB:', { player1Score, player2Score })
      } else if (gameState) {
        // For live matches, use Redis scores
        player1Score = gameState.player1_score
        player2Score = gameState.player2_score
      } else {
        // Fallback: use match scores or current scores
        player1Score = isPlayer1 ? score : match.player1_score || 0
        player2Score = isPlayer1 ? match.player2_score || 0 : score
      }

      console.log('[Match Completion] Finalizing match:', {
        matchId,
        player1Score,
        player2Score,
        player1Fid: match.player1_fid,
        player2Fid: match.player2_fid
      })

      // Check for forfeits
      const totalQuestions = gameState?.questions.length || 10 // Default to 10 if no game state
      const player1Answers = await getPlayerAnswers(matchId, match.player1_fid)
      const player2Answers = match.player2_fid ? await getPlayerAnswers(matchId, match.player2_fid) : []

      let forfeitedBy: number | null = null
      if (player1Answers.length < totalQuestions) {
        forfeitedBy = match.player1_fid
      } else if (match.player2_fid && player2Answers.length < totalQuestions) {
        forfeitedBy = match.player2_fid
      }

      // Determine winner
      const winnerFid = match.player2_fid
        ? determineWinner(player1Score, player2Score, match.player1_fid, match.player2_fid)
        : match.player1_fid // Player 1 wins by default if no player 2

      // Finalize match in database
      // This triggers the database trigger that updates user stats
      await finalizeMatch(matchId, winnerFid, player1Score, player2Score, forfeitedBy)

      // Update challenge status if async
      if (isAsync) {
        await updateChallengeStatus(matchId, 'completed')

        // Send notification to challenger that opponent completed
        try {
          const challengerFid = isPlayer1 ? match.player2_fid : match.player1_fid

          // Skip notification if no challenger (shouldn't happen for async matches)
          if (!challengerFid) {
            throw new Error('No challenger FID found for notification')
          }

          const { data: users } = await supabase
            .from('users')
            .select('fid, username, display_name, notification_token, notification_url, notifications_enabled')
            .in('fid', [fid, challengerFid])

          const challenger = users?.find(u => u.fid === challengerFid)
          const opponent = users?.find(u => u.fid === fid)

          if (challenger?.notifications_enabled && challenger.notification_token && challenger.notification_url) {
            const opponentName = opponent?.display_name || opponent?.username || 'Someone'

            await fetch(challenger.notification_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${challenger.notification_token}`
              },
              body: JSON.stringify({
                notificationId: crypto.randomUUID(),
                title: TEXT.CHALLENGE.NOTIF_COMPLETE_TITLE,
                body: TEXT.CHALLENGE.NOTIF_COMPLETE_BODY(opponentName),
                targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?screen=challenges`,
                tokens: [challenger.notification_token]
              })
            }).catch(err => console.error('Failed to send notification:', err))
          }
        } catch (notifError) {
          console.error('[Match Completion] Error sending notification:', notifError)
        }
      }

      // Broadcast completion for live matches
      if (!isAsync && gameState) {
        const channel = supabase.channel(`game:${matchId}`)
        await broadcastGameComplete(channel, {
          winnerFid,
          scores: {
            p1: player1Score,
            p2: player2Score,
          },
        })
      }

      // Cleanup Redis if session exists
      // For async matches, clean up regardless of whether gameState was found
      // (might have been created by either player)
      if (gameState || isAsync) {
        try {
          await deleteGameSession(matchId)
          console.log('[Match Completion] Cleaned up Redis session')
        } catch (cleanupError) {
          console.error('[Match Completion] Error cleaning up Redis:', cleanupError)
          // Don't fail the completion if cleanup fails
        }
      }

      // Determine result for this player
      let result: 'win' | 'loss' | 'draw'
      if (winnerFid === fid) {
        result = 'win'
      } else if (winnerFid === null) {
        result = 'draw'
      } else {
        result = 'loss'
      }

      return {
        bothCompleted: true,
        result,
        playerScore: isPlayer1 ? player1Score : player2Score,
        opponentScore: isPlayer1 ? player2Score : player1Score,
        winnerFid
      }
    }

    // Only this player completed, wait for opponent
    return {
      bothCompleted: false,
      waitingForOpponent: true,
      playerScore: score,
      opponentScore: isPlayer1 ? match.player2_score : match.player1_score,
    }
  } catch (error) {
    console.error('[Match Completion] Error:', error)
    throw error
  }
}

/**
 * Helper to check if a match is ready to be finalized
 * Used by async challenges to check status
 */
export async function isMatchReadyToFinalize(matchId: string): Promise<boolean> {
  try {
    const { data: match } = await supabase
      .from('matches')
      .select('player1_completed_at, player2_completed_at')
      .eq('id', matchId)
      .single()

    return !!match?.player1_completed_at && !!match?.player2_completed_at
  } catch (error) {
    console.error('[Match Completion] Error checking match status:', error)
    return false
  }
}
