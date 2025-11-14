/**
 * Flair/Title System Types
 */

export interface Flair {
  id: string
  name: string
  description: string
  icon: string
  requirement: {
    type: 'wins' | 'points' | 'streak'
    count: number
  }
  topic?: string
  earned_at?: string
}

export interface FlairResponse {
  available_flairs?: Flair[]
  earned_flairs: Flair[]
  active_flair: Flair | null
  current_wins?: number
}

export interface FlairActionRequest {
  fid: number
  action: 'set_active' | 'check_and_award'
  flair_id?: string | null
  topic?: string
}
