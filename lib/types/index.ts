// Unified types for cross-platform compatibility (Farcaster + World App)

export type Platform = 'farcaster' | 'world'

export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
}

export interface UnifiedUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  walletAddress?: string
  platform: Platform
}

export type AppScreen =
  | "topics"
  | "matchmaking"
  | "matchFound"
  | "game"
  | "profile"
  | "leaderboard"
  | "friends"
  | "challenges"

export interface PlayerData {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  activeFlair?: any
}

export interface MatchData {
  match_id: string
  myPlayer: PlayerData
  opponent: PlayerData
}

export interface WorldContact {
  walletAddress: string
  username?: string
  profilePictureUrl?: string
  inDatabase?: boolean
  fid?: number
  displayName?: string
  pfpUrl?: string
}

export interface Question {
  id: string
  topic: string
  question: string
  options: string[]
  correct_answer: string
  image_url?: string | null
  difficulty?: string | null
}

export interface PlayerScore {
  fid: number
  score: number
  answers: number
  correct: number
}

export type GamePhase = 'connecting' | 'waiting' | 'ready' | 'playing' | 'answered' | 'question' | 'result' | 'complete'
