/**
 * Match Results Utilities
 * Single source of truth for winner determination and result calculation
 *
 * Based on the logic from app/api/matches/[id]/details/route.ts (most correct implementation)
 */

export type MatchResult = 'win' | 'loss' | 'draw'

/**
 * Determine the winner of a match based on scores
 * @param player1Score - Score of player 1
 * @param player2Score - Score of player 2
 * @param player1Fid - FID of player 1
 * @param player2Fid - FID of player 2
 * @returns Winner's FID or null for draw
 */
export function determineWinner(
  player1Score: number,
  player2Score: number,
  player1Fid: number,
  player2Fid: number
): number | null {
  if (player1Score > player2Score) {
    return player1Fid
  } else if (player2Score > player1Score) {
    return player2Fid
  } else {
    return null // Draw
  }
}

/**
 * Get the result for a specific player in a match
 * Handles forfeits correctly - forfeiter always loses
 *
 * @param winnerFid - FID of the winner (null for draw)
 * @param playerFid - FID of the player we're getting the result for
 * @param forfeitedBy - FID of player who forfeited (if any)
 * @param myFid - FID of current user (for forfeit checks)
 * @returns 'win', 'loss', or 'draw'
 */
export function getPlayerResult(
  winnerFid: number | null,
  playerFid: number,
  forfeitedBy?: number | null,
  myFid?: number
): MatchResult {
  // Handle forfeit cases
  if (forfeitedBy !== null && forfeitedBy !== undefined) {
    // If I forfeited, I lost
    if (myFid !== undefined && forfeitedBy === myFid) {
      return 'loss'
    }
    // If opponent forfeited, I won
    if (myFid !== undefined && forfeitedBy !== myFid) {
      return 'win'
    }
    // For general case: if this player forfeited, they lost
    if (forfeitedBy === playerFid) {
      return 'loss'
    }
    // If someone else forfeited, this player won
    return 'win'
  }

  // Normal win/loss/draw logic (CORRECT VERSION - checks both conditions)
  if (winnerFid === playerFid) {
    return 'win'
  } else if (winnerFid !== null && winnerFid !== playerFid) {
    return 'loss'
  } else {
    return 'draw'
  }
}

/**
 * Format a match from the database for display in match history
 * Handles player perspective (my_score vs opponent_score)
 *
 * @param match - Raw match from database
 * @param playerFid - FID of the player viewing this match
 * @param userMap - Map of fid → user data
 * @returns Formatted match object with player/opponent perspective
 */
export function formatMatchForHistory(
  match: any,
  playerFid: number,
  userMap: Map<number, any>
) {
  const isPlayer1 = match.player1_fid === playerFid
  const myScore = isPlayer1 ? match.player1_score : match.player2_score
  const opponentScore = isPlayer1 ? match.player2_score : match.player1_score
  const opponentFid = isPlayer1 ? match.player2_fid : match.player1_fid

  const player = userMap.get(playerFid)
  const opponent = userMap.get(opponentFid)

  // Get result using the correct logic
  const result = getPlayerResult(match.winner_fid, playerFid, match.forfeited_by, playerFid)

  return {
    id: match.id,
    topic: match.topic,
    my_score: myScore,
    opponent_score: opponentScore,
    result,
    player: {
      fid: player?.fid,
      username: player?.username,
      display_name: player?.display_name,
      pfp_url: player?.pfp_url,
      active_flair: player?.active_flair
    },
    opponent: {
      fid: opponent?.fid,
      username: opponent?.username,
      display_name: opponent?.display_name,
      pfp_url: opponent?.pfp_url,
      active_flair: opponent?.active_flair
    },
    completed_at: match.completed_at,
    is_async: match.is_async || false,
    forfeited_by: match.forfeited_by || null
  }
}

/**
 * Check if a player won based on winner FID
 * @param winnerFid - FID of the winner
 * @param playerFid - FID of the player to check
 * @returns true if player won
 */
export function didPlayerWin(winnerFid: number | null, playerFid: number): boolean {
  return winnerFid === playerFid
}

/**
 * Check if match is a draw
 * @param winnerFid - FID of the winner
 * @returns true if draw
 */
export function isMatchDraw(winnerFid: number | null): boolean {
  return winnerFid === null
}

/**
 * Get scores from player perspective
 * @param match - Match object with player1/player2 scores
 * @param playerFid - FID of the player
 * @returns { myScore, opponentScore, isPlayer1 }
 */
export function getPlayerScores(match: any, playerFid: number) {
  const isPlayer1 = match.player1_fid === playerFid
  return {
    myScore: isPlayer1 ? match.player1_score : match.player2_score,
    opponentScore: isPlayer1 ? match.player2_score : match.player1_score,
    isPlayer1
  }
}
