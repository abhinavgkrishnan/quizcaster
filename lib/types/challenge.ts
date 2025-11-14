/**
 * Async Challenge System Types
 */

import type { Friend } from './friends'

export type AsyncChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed'
export type AsyncMatchStatus = 'waiting_for_opponent' | 'in_progress' | 'completed' | 'declined'

export interface AsyncChallenge {
  id: string
  match_id: string
  challenger_fid: number
  challenged_fid: number | null
  topic: string
  status: AsyncChallengeStatus
  challenge_message?: string | null
  share_url?: string | null
  created_at: string
  expires_at: string
  accepted_at?: string | null
  completed_at?: string | null
  challenger?: Friend
  challenged?: Friend
}

export interface ChallengerAnswer {
  questionId: string
  answer: string
  isCorrect: boolean
  timeTaken: number
  points: number
}

export interface ChallengerGameData {
  score: number
  answers: ChallengerAnswer[]
  questions: any[]
  questionIds: string[]
}

export interface ChallengesResponse {
  challenges: AsyncChallenge[]
}

export interface ChallengeCreateRequest {
  action: 'create'
  challenger_fid: number
  challenged_fid?: number | null
  topic: string
  challenge_message?: string
}

export interface ChallengeActionRequest {
  action: 'accept' | 'decline' | 'complete_challenger'
  challenge_id?: string
  match_id?: string
  challenger_data?: ChallengerGameData
}
