export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      async_challenges: {
        Row: {
          accepted_at: string | null
          challenge_message: string | null
          challenged_fid: number | null
          challenger_fid: number
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          match_id: string
          share_url: string | null
          status: string
          topic: string
        }
        Insert: {
          accepted_at?: string | null
          challenge_message?: string | null
          challenged_fid?: number | null
          challenger_fid: number
          completed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          match_id: string
          share_url?: string | null
          status?: string
          topic: string
        }
        Update: {
          accepted_at?: string | null
          challenge_message?: string | null
          challenged_fid?: number | null
          challenger_fid?: number
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string
          share_url?: string | null
          status?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "async_challenges_challenged_fid_fkey"
            columns: ["challenged_fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
          {
            foreignKeyName: "async_challenges_challenger_fid_fkey"
            columns: ["challenger_fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
          {
            foreignKeyName: "async_challenges_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_fid: number
          created_at: string | null
          id: string
          requester_fid: number
          status: string
          updated_at: string | null
        }
        Insert: {
          addressee_fid: number
          created_at?: string | null
          id?: string
          requester_fid: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          addressee_fid?: number
          created_at?: string | null
          id?: string
          requester_fid?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_fid_fkey"
            columns: ["addressee_fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
          {
            foreignKeyName: "friendships_requester_fid_fkey"
            columns: ["requester_fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
        ]
      }
      match_answers: {
        Row: {
          answer_given: string
          answered_at: string
          fid: number
          id: string
          is_correct: boolean
          match_id: string
          points_earned: number
          question_id: string
          question_number: number
          time_taken_ms: number
        }
        Insert: {
          answer_given: string
          answered_at?: string
          fid: number
          id?: string
          is_correct: boolean
          match_id: string
          points_earned: number
          question_id: string
          question_number: number
          time_taken_ms: number
        }
        Update: {
          answer_given?: string
          answered_at?: string
          fid?: number
          id?: string
          is_correct?: boolean
          match_id?: string
          points_earned?: number
          question_id?: string
          question_number?: number
          time_taken_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_answers_fid_users_fid_fk"
            columns: ["fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
          {
            foreignKeyName: "match_answers_match_id_matches_id_fk"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_answers_question_id_questions_id_fk"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          async_status: string | null
          challenge_message: string | null
          challenger_data: Json | null
          completed_at: string | null
          created_at: string
          expires_at: string | null
          forfeited_by: number | null
          id: string
          is_async: boolean | null
          is_bot_opponent: boolean
          last_activity_at: string | null
          match_type: string
          player1_completed_at: string | null
          player1_fid: number
          player1_score: number
          player2_completed_at: string | null
          player2_fid: number | null
          player2_score: number
          questions_used: Json
          redis_session_id: string | null
          started_at: string | null
          status: string
          topic: string
          winner_fid: number | null
        }
        Insert: {
          async_status?: string | null
          challenge_message?: string | null
          challenger_data?: Json | null
          forfeited_by?: number | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_async?: boolean | null
          is_bot_opponent?: boolean
          last_activity_at?: string | null
          match_type: string
          player1_completed_at?: string | null
          player1_fid: number
          player1_score?: number
          player2_completed_at?: string | null
          player2_fid?: number | null
          player2_score?: number
          questions_used: Json
          redis_session_id?: string | null
          started_at?: string | null
          status: string
          topic: string
          winner_fid?: number | null
        }
        Update: {
          async_status?: string | null
          challenge_message?: string | null
          challenger_data?: Json | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          forfeited_by?: number | null
          id?: string
          is_async?: boolean | null
          is_bot_opponent?: boolean
          last_activity_at?: string | null
          match_type?: string
          player1_completed_at?: string | null
          player1_fid?: number
          player1_score?: number
          player2_completed_at?: string | null
          player2_fid?: number | null
          player2_score?: number
          questions_used?: Json
          redis_session_id?: string | null
          started_at?: string | null
          status?: string
          topic?: string
          winner_fid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player1_fid_users_fid_fk"
            columns: ["player1_fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
          {
            foreignKeyName: "matches_player2_fid_users_fid_fk"
            columns: ["player2_fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: string | null
          id: string
          image_url: string | null
          is_active: boolean
          options: Json
          question: string
          topic: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          options: Json
          question: string
          topic: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          options?: Json
          question?: string
          topic?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          color_class: string | null
          created_at: string
          description: string | null
          display_name: string
          flairs: Json | null
          icon_name: string | null
          is_active: boolean
          question_count: number
          slug: string
          sort_order: number
        }
        Insert: {
          color_class?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          flairs?: Json | null
          icon_name?: string | null
          is_active?: boolean
          question_count?: number
          slug: string
          sort_order?: number
        }
        Update: {
          color_class?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          flairs?: Json | null
          icon_name?: string | null
          is_active?: boolean
          question_count?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_stats_by_topic: {
        Row: {
          avg_response_time_ms: number | null
          best_streak: number
          fid: number
          matches_drawn: number
          matches_lost: number
          matches_played: number
          matches_won: number
          questions_answered: number
          questions_correct: number
          topic: string
          total_points: number
          updated_at: string
        }
        Insert: {
          avg_response_time_ms?: number | null
          best_streak?: number
          fid: number
          matches_drawn?: number
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          questions_answered?: number
          questions_correct?: number
          topic: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          avg_response_time_ms?: number | null
          best_streak?: number
          fid?: number
          matches_drawn?: number
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          questions_answered?: number
          questions_correct?: number
          topic?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_by_topic_fid_users_fid_fk"
            columns: ["fid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
        ]
      }
      user_stats_overall: {
        Row: {
          avg_response_time_ms: number | null
          fid: number
          global_rank: number | null
          longest_streak: number
          total_correct: number
          total_draws: number
          total_losses: number
          total_matches: number
          total_points: number
          total_questions: number
          total_wins: number
          updated_at: string
        }
        Insert: {
          avg_response_time_ms?: number | null
          fid: number
          global_rank?: number | null
          longest_streak?: number
          total_correct?: number
          total_draws?: number
          total_losses?: number
          total_matches?: number
          total_points?: number
          total_questions?: number
          total_wins?: number
          updated_at?: string
        }
        Update: {
          avg_response_time_ms?: number | null
          fid?: number
          global_rank?: number | null
          longest_streak?: number
          total_correct?: number
          total_draws?: number
          total_losses?: number
          total_matches?: number
          total_points?: number
          total_questions?: number
          total_wins?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_overall_fid_users_fid_fk"
            columns: ["fid"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["fid"]
          },
        ]
      }
      users: {
        Row: {
          active_flair: Json | null
          created_at: string
          display_name: string
          earned_flairs: Json | null
          fid: number
          last_active: string
          notification_token: string | null
          notification_url: string | null
          notifications_enabled: boolean | null
          pfp_url: string | null
          username: string
        }
        Insert: {
          active_flair?: Json | null
          created_at?: string
          display_name: string
          earned_flairs?: Json | null
          fid: number
          last_active?: string
          notification_token?: string | null
          notification_url?: string | null
          notifications_enabled?: boolean | null
          pfp_url?: string | null
          username: string
        }
        Update: {
          active_flair?: Json | null
          created_at?: string
          display_name?: string
          earned_flairs?: Json | null
          fid?: number
          last_active?: string
          notification_token?: string | null
          notification_url?: string | null
          notifications_enabled?: boolean | null
          pfp_url?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_stats: {
        Args: { p_fid: number; p_match_id: string }
        Returns: {
          accuracy: number
          avg_response_time_ms: number
          questions_answered: number
          questions_correct: number
          total_points: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
