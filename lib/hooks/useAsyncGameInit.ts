import { useState, useEffect } from 'react'

interface UseAsyncGameInitOptions {
  matchId: string
  fid: number
}

/**
 * Custom hook for initializing async game session in Redis
 * Returns initialization status
 */
export function useAsyncGameInit({ matchId, fid }: UseAsyncGameInitOptions) {
  const [gameInitialized, setGameInitialized] = useState(false)

  useEffect(() => {
    const initGame = async () => {
      try {
        await fetch(`/api/matches/${matchId}/start-async`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid })
        })
        setGameInitialized(true)
      } catch (error) {
        console.error('[AsyncGameInit] Failed to initialize game:', error)
      }
    }
    initGame()
  }, [matchId, fid])

  return gameInitialized
}
