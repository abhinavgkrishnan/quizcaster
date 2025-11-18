import { useState, useEffect, useRef } from 'react'
import { GAME_CONFIG } from '@/lib/constants'

interface UseGameTimerOptions {
  /** Current question index or identifier to reset timer on change */
  questionKey: number | string
  /** Whether to pause/disable the timer */
  isPaused?: boolean
  /** Callback when timer reaches 0 */
  onTimeout: () => void
}

/**
 * Custom hook for managing game question timer
 * Handles countdown with configurable delay for options loading
 */
export function useGameTimer({ questionKey, isPaused = false, onTimeout }: UseGameTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME_CONFIG.QUESTION_TIME_LIMIT)
  const onTimeoutRef = useRef(onTimeout)

  // Keep the ref up to date
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    if (isPaused) return

    // Reset timer when question changes
    setTimeRemaining(GAME_CONFIG.QUESTION_TIME_LIMIT)

    // Wait for options to load (OPTIONS_LOAD_DELAY + TIMER_START_BUFFER)
    const totalDelay = GAME_CONFIG.OPTIONS_LOAD_DELAY + GAME_CONFIG.TIMER_START_BUFFER
    let interval: NodeJS.Timeout

    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            onTimeoutRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, totalDelay)

    return () => {
      clearTimeout(startTimer)
      if (interval) clearInterval(interval)
    }
  }, [questionKey, isPaused])

  return timeRemaining
}
