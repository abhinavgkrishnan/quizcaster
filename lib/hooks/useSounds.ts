import { useRef, useCallback } from 'react'

export function useSounds() {
  const correctSoundRef = useRef<HTMLAudioElement | null>(null)
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null)
  const timerSoundRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio elements
  if (typeof window !== 'undefined') {
    if (!correctSoundRef.current) {
      correctSoundRef.current = new Audio('/sounds/correct-ans.mp3')
    }
    if (!wrongSoundRef.current) {
      wrongSoundRef.current = new Audio('/sounds/wrong-ans.mp3')
    }
    if (!timerSoundRef.current) {
      timerSoundRef.current = new Audio('/sounds/Manikkutty.mp3')
      timerSoundRef.current.loop = true
    }
  }

  const playCorrect = useCallback(() => {
    if (correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0
      correctSoundRef.current.play().catch(err => console.error('Error playing correct sound:', err))
    }
  }, [])

  const playWrong = useCallback(() => {
    if (wrongSoundRef.current) {
      wrongSoundRef.current.currentTime = 0
      wrongSoundRef.current.play().catch(err => console.error('Error playing wrong sound:', err))
    }
  }, [])

  const startTimer = useCallback(() => {
    if (timerSoundRef.current) {
      timerSoundRef.current.currentTime = 0
      timerSoundRef.current.play().catch(err => console.error('Error playing timer sound:', err))
    }
  }, [])

  const stopTimer = useCallback(() => {
    if (timerSoundRef.current) {
      timerSoundRef.current.pause()
      timerSoundRef.current.currentTime = 0
    }
  }, [])

  return {
    playCorrect,
    playWrong,
    startTimer,
    stopTimer
  }
}
