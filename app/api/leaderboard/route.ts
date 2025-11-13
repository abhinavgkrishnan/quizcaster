import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic'); // null = overall
    const sortBy = searchParams.get('sortBy') || 'winrate'; // winrate, accuracy, avgtime, streak
    const limit = parseInt(searchParams.get('limit') || '50');

    if (topic) {
      // Topic-specific leaderboard
      const { data, error } = await supabase
        .from('user_stats_by_topic')
        .select(`
          fid,
          topic,
          matches_played,
          matches_won,
          matches_lost,
          matches_drawn,
          total_points,
          questions_answered,
          questions_correct,
          avg_response_time_ms,
          best_streak,
          users!inner(username, display_name, pfp_url)
        `)
        .eq('topic', topic)
        .gte('matches_played', 1); // Only show players who played

      if (error) {
        console.error('Error fetching topic leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
      }

      // Calculate derived stats and sort
      const stats = (data || []).map(stat => {
        const winRate = stat.matches_played > 0
          ? ((stat.matches_won / stat.matches_played) * 100).toFixed(1)
          : '0';
        const accuracy = stat.questions_answered > 0
          ? ((stat.questions_correct / stat.questions_answered) * 100).toFixed(1)
          : '0';
        const avgTimeSeconds = stat.avg_response_time_ms
          ? (stat.avg_response_time_ms / 1000).toFixed(1)
          : '0';

        return {
          fid: stat.fid,
          username: (stat.users as any).username,
          displayName: (stat.users as any).display_name,
          pfpUrl: (stat.users as any).pfp_url,
          matchesPlayed: stat.matches_played,
          wins: stat.matches_won,
          losses: stat.matches_lost,
          draws: stat.matches_drawn,
          totalPoints: stat.total_points,
          winRate: parseFloat(winRate),
          accuracy: parseFloat(accuracy),
          avgTime: parseFloat(avgTimeSeconds),
          bestStreak: stat.best_streak,
        };
      });

      // Sort based on sortBy parameter
      let sorted = stats;
      switch (sortBy) {
        case 'winrate':
          sorted = stats.sort((a, b) => b.winRate - a.winRate);
          break;
        case 'accuracy':
          sorted = stats.sort((a, b) => b.accuracy - a.accuracy);
          break;
        case 'avgtime':
          sorted = stats.sort((a, b) => a.avgTime - b.avgTime); // Lower is better
          break;
        case 'streak':
          sorted = stats.sort((a, b) => b.bestStreak - a.bestStreak);
          break;
      }

      return NextResponse.json({
        leaderboard: sorted.slice(0, limit),
        topic,
        sortBy,
      });
    } else {
      // Overall leaderboard
      const { data, error } = await supabase
        .from('user_stats_overall')
        .select(`
          fid,
          total_matches,
          total_wins,
          total_losses,
          total_draws,
          total_points,
          total_questions,
          total_correct,
          avg_response_time_ms,
          longest_streak,
          global_rank,
          users!inner(username, display_name, pfp_url)
        `)
        .gte('total_matches', 1); // Only show players who played

      if (error) {
        console.error('Error fetching overall leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
      }

      // Calculate derived stats and sort
      const stats = (data || []).map(stat => {
        const winRate = stat.total_matches > 0
          ? ((stat.total_wins / stat.total_matches) * 100).toFixed(1)
          : '0';
        const accuracy = stat.total_questions > 0
          ? ((stat.total_correct / stat.total_questions) * 100).toFixed(1)
          : '0';
        const avgTimeSeconds = stat.avg_response_time_ms
          ? (stat.avg_response_time_ms / 1000).toFixed(1)
          : '0';

        return {
          fid: stat.fid,
          username: (stat.users as any).username,
          displayName: (stat.users as any).display_name,
          pfpUrl: (stat.users as any).pfp_url,
          matchesPlayed: stat.total_matches,
          wins: stat.total_wins,
          losses: stat.total_losses,
          draws: stat.total_draws,
          totalPoints: stat.total_points,
          winRate: parseFloat(winRate),
          accuracy: parseFloat(accuracy),
          avgTime: parseFloat(avgTimeSeconds),
          bestStreak: stat.longest_streak,
        };
      });

      // Sort based on sortBy parameter
      let sorted = stats;
      switch (sortBy) {
        case 'winrate':
          sorted = stats.sort((a, b) => b.winRate - a.winRate);
          break;
        case 'accuracy':
          sorted = stats.sort((a, b) => b.accuracy - a.accuracy);
          break;
        case 'avgtime':
          sorted = stats.sort((a, b) => a.avgTime - b.avgTime); // Lower is better
          break;
        case 'streak':
          sorted = stats.sort((a, b) => b.bestStreak - a.bestStreak);
          break;
      }

      return NextResponse.json({
        leaderboard: sorted.slice(0, limit),
        topic: null,
        sortBy,
      });
    }
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
