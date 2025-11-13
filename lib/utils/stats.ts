/**
 * User Stats Update Utilities
 * Updates user statistics after match completion
 */

import { supabase } from './supabase';

interface MatchResult {
  matchId: string;
  topic: string;
  player1Fid: number;
  player2Fid: number;
  player1Score: number;
  player2Score: number;
  winnerFid: number | null;
  player1Answers: Array<{ is_correct: boolean; time_taken_ms: number }>;
  player2Answers: Array<{ is_correct: boolean; time_taken_ms: number }>;
}

/**
 * Update user stats after a match completes
 * Handles: matches played, wins/losses, accuracy, avg time, streaks
 */
export async function updateUserStatsAfterMatch(result: MatchResult): Promise<void> {
  try {
    // Update stats for both players
    await Promise.all([
      updatePlayerStats(
        result.player1Fid,
        result.topic,
        result.winnerFid === result.player1Fid,
        result.winnerFid === null,
        result.player1Answers
      ),
      updatePlayerStats(
        result.player2Fid,
        result.topic,
        result.winnerFid === result.player2Fid,
        result.winnerFid === null,
        result.player2Answers
      ),
    ]);
  } catch (error) {
    console.error('[Stats] Error updating user stats:', error);
  }
}

async function updatePlayerStats(
  fid: number,
  topic: string,
  isWin: boolean,
  isDraw: boolean,
  answers: Array<{ is_correct: boolean; time_taken_ms: number }>
): Promise<void> {
  const correctAnswers = answers.filter(a => a.is_correct).length;
  const totalAnswers = answers.length;
  const avgTime = answers.length > 0
    ? Math.round(answers.reduce((sum, a) => sum + a.time_taken_ms, 0) / answers.length)
    : 0;

  // Get player's last match result to determine streak
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('winner_fid, player1_fid, player2_fid, completed_at')
    .or(`player1_fid.eq.${fid},player2_fid.eq.${fid}`)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(20); // Get last 20 matches to calculate streak

  // Calculate current streak (consecutive wins from most recent)
  let currentStreak = 0;
  if (recentMatches) {
    for (const match of recentMatches) {
      if (match.winner_fid === fid) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }
  }

  // If this match was a win, current streak includes this match
  if (isWin) {
    currentStreak++; // Add current match to streak
  }

  // Update user_stats_by_topic
  const { data: existingTopicStats } = await supabase
    .from('user_stats_by_topic')
    .select('*')
    .eq('fid', fid)
    .eq('topic', topic)
    .single();

  const topicStats = {
    fid,
    topic,
    matches_played: (existingTopicStats?.matches_played || 0) + 1,
    matches_won: (existingTopicStats?.matches_won || 0) + (isWin ? 1 : 0),
    matches_lost: (existingTopicStats?.matches_lost || 0) + (!isWin && !isDraw ? 1 : 0),
    matches_drawn: (existingTopicStats?.matches_drawn || 0) + (isDraw ? 1 : 0),
    total_points: (existingTopicStats?.total_points || 0) + answers.reduce((sum, a) => sum + (a as any).points_earned || 0, 0),
    questions_answered: (existingTopicStats?.questions_answered || 0) + totalAnswers,
    questions_correct: (existingTopicStats?.questions_correct || 0) + correctAnswers,
    avg_response_time_ms: Math.round(
      ((existingTopicStats?.avg_response_time_ms || 0) * (existingTopicStats?.questions_answered || 0) + avgTime * totalAnswers) /
      ((existingTopicStats?.questions_answered || 0) + totalAnswers)
    ),
    best_streak: Math.max(existingTopicStats?.best_streak || 0, currentStreak), // Update if current > best
    updated_at: new Date().toISOString(),
  };

  await supabase.from('user_stats_by_topic').upsert(topicStats);

  // Update user_stats_overall
  const { data: existingOverallStats } = await supabase
    .from('user_stats_overall')
    .select('*')
    .eq('fid', fid)
    .single();

  const overallStats = {
    fid,
    total_matches: (existingOverallStats?.total_matches || 0) + 1,
    total_wins: (existingOverallStats?.total_wins || 0) + (isWin ? 1 : 0),
    total_losses: (existingOverallStats?.total_losses || 0) + (!isWin && !isDraw ? 1 : 0),
    total_draws: (existingOverallStats?.total_draws || 0) + (isDraw ? 1 : 0),
    total_points: (existingOverallStats?.total_points || 0) + answers.reduce((sum, a) => sum + (a as any).points_earned || 0, 0),
    total_questions: (existingOverallStats?.total_questions || 0) + totalAnswers,
    total_correct: (existingOverallStats?.total_correct || 0) + correctAnswers,
    avg_response_time_ms: Math.round(
      ((existingOverallStats?.avg_response_time_ms || 0) * (existingOverallStats?.total_questions || 0) + avgTime * totalAnswers) /
      ((existingOverallStats?.total_questions || 0) + totalAnswers)
    ),
    longest_streak: Math.max(existingOverallStats?.longest_streak || 0, currentStreak), // Update if current > best
    updated_at: new Date().toISOString(),
  };

  await supabase.from('user_stats_overall').upsert(overallStats);
}
