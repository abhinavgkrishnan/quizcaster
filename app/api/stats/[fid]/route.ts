import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import type { Tables } from '@/lib/database.types'

type UserStatsOverall = Tables<'user_stats_overall'>
type UserStatsByTopic = Tables<'user_stats_by_topic'>

interface OverallStatsResponse {
  total_matches: number
  total_wins: number
  total_losses: number
  total_draws: number
  win_rate: string
  total_points: number
  total_questions: number
  total_correct: number
  accuracy: string
  avg_response_time_ms: number
  avg_response_time_s: string
  current_streak: number
  longest_streak: number
  global_rank: number | null
}

interface TopicStatsResponse {
  matches_played: number
  matches_won: number
  matches_lost: number
  matches_drawn: number
  win_rate: string
  total_points: number
  questions_answered: number
  questions_correct: number
  accuracy: string
  avg_response_time_ms: number
  avg_response_time_s: string
  best_streak: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await params
    const fidNumber = parseInt(fid)

    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    // Get overall stats
    const { data: overall } = await supabase
      .from('user_stats_overall')
      .select('*')
      .eq('fid', fidNumber)
      .single()

    // Get recent matches to calculate current streak
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('winner_fid, player1_fid, player2_fid, completed_at')
      .or(`player1_fid.eq.${fidNumber},player2_fid.eq.${fidNumber}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20)

    let currentStreak = 0
    if (recentMatches) {
      for (const match of recentMatches) {
        if (match.winner_fid === fidNumber) {
          currentStreak++
        } else if (match.winner_fid !== null) {
          break // Loss breaks streak
        }
        // Draw (winner_fid === null) continues without incrementing
      }
    }

    // Get topic stats
    const { data: topicStats } = await supabase
      .from('user_stats_by_topic')
      .select('*')
      .eq('fid', fidNumber)

    // Calculate derived metrics
    const overallData: OverallStatsResponse = overall ? {
      total_matches: overall.total_matches,
      total_wins: overall.total_wins,
      total_losses: overall.total_losses,
      total_draws: overall.total_draws,
      win_rate: overall.total_matches > 0
        ? ((overall.total_wins / overall.total_matches) * 100).toFixed(2)
        : '0.00',
      total_points: overall.total_points,
      total_questions: overall.total_questions,
      total_correct: overall.total_correct,
      accuracy: overall.total_questions > 0
        ? ((overall.total_correct / overall.total_questions) * 100).toFixed(2)
        : '0.00',
      avg_response_time_ms: overall.avg_response_time_ms || 0,
      avg_response_time_s: overall.avg_response_time_ms
        ? (overall.avg_response_time_ms / 1000).toFixed(1)
        : '0.0',
      current_streak: currentStreak,
      longest_streak: overall.longest_streak,
      global_rank: overall.global_rank
    } : {
      total_matches: 0,
      total_wins: 0,
      total_losses: 0,
      total_draws: 0,
      win_rate: '0.00',
      total_points: 0,
      total_questions: 0,
      total_correct: 0,
      accuracy: '0.00',
      avg_response_time_ms: 0,
      avg_response_time_s: '0.0',
      current_streak: 0,
      longest_streak: 0,
      global_rank: null
    }

    // Format topic stats
    const byTopic: Record<string, TopicStatsResponse> = {}
    if (topicStats) {
      topicStats.forEach(stat => {
        byTopic[stat.topic] = {
          matches_played: stat.matches_played,
          matches_won: stat.matches_won,
          matches_lost: stat.matches_lost,
          matches_drawn: stat.matches_drawn,
          win_rate: stat.matches_played > 0
            ? ((stat.matches_won / stat.matches_played) * 100).toFixed(2)
            : '0.00',
          total_points: stat.total_points,
          questions_answered: stat.questions_answered,
          questions_correct: stat.questions_correct,
          accuracy: stat.questions_answered > 0
            ? ((stat.questions_correct / stat.questions_answered) * 100).toFixed(2)
            : '0.00',
          avg_response_time_ms: stat.avg_response_time_ms || 0,
          avg_response_time_s: stat.avg_response_time_ms
            ? (stat.avg_response_time_ms / 1000).toFixed(1)
            : '0.0',
          best_streak: stat.best_streak
        }
      })
    }

    return NextResponse.json({
      overall: overallData,
      by_topic: byTopic
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
