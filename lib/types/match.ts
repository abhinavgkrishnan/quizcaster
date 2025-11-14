/**
 * Match-related Types
 */

import type { Friend } from './friends'

export interface MatchHistoryItem {
  id: string
  topic: string
  my_score: number
  opponent_score: number
  result: 'win' | 'loss' | 'draw'
  opponent: Friend
  completed_at: string
  is_async: boolean
}

export interface MatchHistoryResponse {
  matches: MatchHistoryItem[]
  total: number
  has_more: boolean
}

export interface TopicWithFlairs {
  slug: string
  display_name: string
  description?: string | null
  icon_name?: string | null
  color_class?: string | null
  question_count: number
  flairs?: any[]
  is_active: boolean
  sort_order: number
}
