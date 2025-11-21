"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useAppContext } from "./AppContext"

interface BackgroundMusicContextType {
  isMuted: boolean
  toggleMute: () => void
  volume: number
  setVolume: (volume: number) => void
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType | undefined>(undefined)

export function BackgroundMusicProvider({ children }: { children: ReactNode }) {
  const { isGameScreen, currentScreen, isWaitingScreen } = useAppContext()
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.3) // Default volume at 30%
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInteractedRef = useRef(false)
  const isPlayingRef = useRef(false)

  // Initialize audio element once on mount
  useEffect(() => {
    // Create single audio element for background music
    const audio = new Audio('/sounds/rivalries1.mp3')
    audio.loop = true
    audio.volume = 0
    audioRef.current = audio

    // Load preferences
    const savedMutedState = localStorage.getItem('bgMusicMuted')
    const savedVolume = localStorage.getItem('bgMusicVolume')

    if (savedMutedState === 'true') {
      setIsMuted(true)
    }

    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume)
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        setVolume(parsedVolume)
      }
    }

    // Cleanup
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }
      audio.pause()
      audio.src = ''
    }
  }, [])

  // Determine if music should play
  const shouldPlayMusic = (): boolean => {
    // No music during game screens
    if (isGameScreen) return false

    // Play music for menu screens and matchmaking/waiting
    const musicScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges', 'matchmaking']
    return musicScreens.includes(currentScreen) || isWaitingScreen
  }

  // Handle first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (hasInteractedRef.current) return
      hasInteractedRef.current = true
      console.log('[BgMusic] First user interaction detected')
    }

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction)
      })
    }
  }, [])

  // Toggle mute function
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev
      localStorage.setItem('bgMusicMuted', String(newMuted))
      console.log('[BgMusic] Mute toggled:', newMuted)

      // Immediately update audio volume
      if (audioRef.current && isPlayingRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume
      }

      return newMuted
    })
  }

  // Set volume function
  const handleSetVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    localStorage.setItem('bgMusicVolume', String(clampedVolume))

    // Update audio volume immediately if not muted
    if (audioRef.current && !isMuted && isPlayingRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }

  // Smooth fade function
  const fadeAudio = (
    audio: HTMLAudioElement,
    targetVolume: number,
    duration: number = 300,
    callback?: () => void
  ) => {
    const startVolume = audio.volume
    const volumeDiff = targetVolume - startVolume
    const steps = 15
    const stepDuration = duration / steps
    const stepSize = volumeDiff / steps
    let currentStep = 0

    const fade = () => {
      currentStep++
      if (currentStep <= steps) {
        audio.volume = Math.max(0, Math.min(1, startVolume + (stepSize * currentStep)))
        fadeTimeoutRef.current = setTimeout(fade, stepDuration)
      } else {
        audio.volume = targetVolume
        fadeTimeoutRef.current = null
        if (callback) callback()
      }
    }

    // Clear any existing fade
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }

    if (Math.abs(volumeDiff) < 0.01) {
      audio.volume = targetVolume
      if (callback) callback()
    } else {
      fade()
    }
  }

  // Main music control effect
  useEffect(() => {
    // Don't do anything until user has interacted
    if (!hasInteractedRef.current) {
      console.log('[BgMusic] Waiting for first user interaction...')
      return
    }

    if (!audioRef.current) {
      console.log('[BgMusic] Audio element not initialized')
      return
    }

    const audio = audioRef.current
    const shouldPlay = shouldPlayMusic()
    const targetVolume = isMuted ? 0 : volume

    console.log('[BgMusic] Music state:', {
      currentScreen,
      isGameScreen,
      shouldPlay,
      isPlaying: isPlayingRef.current,
      isMuted,
      targetVolume
    })

    // Start or stop music based on screen
    if (shouldPlay && !isPlayingRef.current) {
      // Start playing
      audio.volume = 0
      audio.play()
        .then(() => {
          console.log('[BgMusic] Started background music')
          isPlayingRef.current = true
          fadeAudio(audio, targetVolume, 300)
        })
        .catch(err => {
          console.error('[BgMusic] Failed to start music:', err)
        })
    } else if (!shouldPlay && isPlayingRef.current) {
      // Stop playing
      fadeAudio(audio, 0, 200, () => {
        audio.pause()
        audio.currentTime = 0
        isPlayingRef.current = false
        console.log('[BgMusic] Stopped background music')
      })
    } else if (shouldPlay && isPlayingRef.current) {
      // Just update volume
      fadeAudio(audio, targetVolume, 200)
    }

  }, [currentScreen, isGameScreen, isWaitingScreen, isMuted, volume])

  return (
    <BackgroundMusicContext.Provider value={{
      isMuted,
      toggleMute,
      volume,
      setVolume: handleSetVolume
    }}>
      {children}
    </BackgroundMusicContext.Provider>
  )
}

export function useBackgroundMusic() {
  const context = useContext(BackgroundMusicContext)
  if (!context) {
    throw new Error("useBackgroundMusic must be used within BackgroundMusicProvider")
  }
  return context
}