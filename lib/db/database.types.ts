export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      async_challenges: {
        Row: {
          id: string
          match_id: string
          challenger_fid: number
          challenged_fid: number | null
          topic: string
          status: string
          challenge_message: string | null
          share_url: string | null
          created_at: string
          expires_at: string
          accepted_at: string | null
          completed_at: string | null
        }
      }
      leaderboards: {
        Row: {
          id: string
          fid: number
          rank: number
          leaderboard_type: string
          period_start: string | null
          period_end: string | null
          total_points: number
          total_wins: number
          matches_played: number
          win_rate: number | null
          updated_at: string
        }
      }
      match_answers: {
        Row: {
          id: string
          match_id: string
          fid: number
          question_id: string
          question_number: number
          answer_given: string
          is_correct: boolean
          time_taken_ms: number
          points_earned: number
          answered_at: string
        }
      }
      matches: {
        Row: {
          id: string
          match_type: string
          topic: string
          player1_fid: number
          player2_fid: number | null
          is_bot_opponent: boolean
          player1_score: number
          player2_score: number
          winner_fid: number | null
          status: string
          questions_used: Json
          player1_completed_at: string | null
          player2_completed_at: string | null
          challenge_message: string | null
          created_at: string
          started_at: string | null
          completed_at: string | null
          expires_at: string | null
        }
      }
      matchmaking_queue: {
        Row: {
          fid: number
          topic: string
          skill_level: number
          joined_at: string
          status: string
          expires_at: string
        }
      }
      questions: {
        Row: {
          id: string
          topic: string
          question: string
          options: Json
          correct_answer: string
          image_url: string | null
          difficulty: string | null
          is_active: boolean
          created_at: string
        }
      }
      topics: {
        Row: {
          slug: string
          display_name: string
          icon_name: string | null
          color_class: string | null
          description: string | null
          question_count: number
          is_active: boolean
          sort_order: number
          created_at: string
        }
      }
      user_stats_by_topic: {
        Row: {
          fid: number
          topic: string
          matches_played: number
          matches_won: number
          matches_lost: number
          matches_drawn: number
          total_points: number
          questions_answered: number
          questions_correct: number
          avg_response_time_ms: number | null
          best_streak: number
          updated_at: string
        }
      }
      user_stats_overall: {
        Row: {
          fid: number
          total_matches: number
          total_wins: number
          total_losses: number
          total_draws: number
          total_points: number
          total_questions: number
          total_correct: number
          avg_response_time_ms: number | null
          longest_streak: number
          global_rank: number | null
          updated_at: string
        }
      }
      users: {
        Row: {
          fid: number
          username: string
          display_name: string
          pfp_url: string | null
          notification_token: string | null
          notification_url: string | null
          notifications_enabled: boolean | null
          created_at: string
          last_active: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
