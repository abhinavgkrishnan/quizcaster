import { useState } from 'react'

interface Question {
  id: string
  question: string
  options: string[]
  imageUrl?: string | null
}

interface MatchData {
  match_id: string
  match_type: string
  topic: string
  questions: Question[]
  opponent: any
  status: string
}

export function useGame() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMatch = async (
    type: 'bot' | 'realtime' | 'async',
    topic: string,
    playerFid: number,
    opponentFid?: number
  ): Promise<MatchData | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          topic,
          player_fid: playerFid,
          opponent_fid: opponentFid
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create match')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async (
    matchId: string,
    fid: number,
    questionId: string,
    questionNumber: number,
    answer: string,
    timeTakenMs: number
  ) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          question_id: questionId,
          question_number: questionNumber,
          answer,
          time_taken_ms: timeTakenMs
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit answer')
      }

      return await response.json()
    } catch (err) {
      console.error('Error submitting answer:', err)
      throw err
    }
  }

  const completeMatch = async (matchId: string, fid: number) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete match')
      }

      return await response.json()
    } catch (err) {
      console.error('Error completing match:', err)
      throw err
    }
  }

  return {
    createMatch,
    submitAnswer,
    completeMatch,
    loading,
    error
  }
}
