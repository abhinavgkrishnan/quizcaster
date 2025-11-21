"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useAppContext } from "./AppContext"

interface BackgroundMusicContextType {
  isMuted: boolean
  toggleMute: () => void
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType | undefined>(undefined)

export function BackgroundMusicProvider({ children }: { children: ReactNode }) {
  const { isGameScreen, currentScreen, isWaitingScreen } = useAppContext()
  const [isMuted, setIsMuted] = useState(false)
  const menuAudioRef = useRef<HTMLAudioElement | null>(null)
  const queueAudioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInteractedRef = useRef(false)

  // Initialize audio elements once
  useEffect(() => {
    const menuAudio = new Audio('/sounds/rivalries1.mp3')
    menuAudio.loop = true
    menuAudio.volume = 0
    menuAudioRef.current = menuAudio

    const queueAudio = new Audio('/sounds/match-queue.mp3')
    queueAudio.loop = true
    queueAudio.volume = 0
    queueAudioRef.current = queueAudio

    // Load mute preference
    const savedMutedState = localStorage.getItem('bgMusicMuted')
    setIsMuted(savedMutedState === 'true')

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }
      menuAudio.pause()
      queueAudio.pause()
    }
  }, [])

  // Determine which track should be active
  const getActiveTrack = (): 'menu' | 'queue' | null => {
    if (isGameScreen) return null
    if (currentScreen === 'matchmaking' || isWaitingScreen) return 'queue'

    const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
    if (menuScreens.includes(currentScreen)) return 'menu'

    return null
  }

  // Fade in a track
  const fadeIn = (audio: HTMLAudioElement) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    const targetVolume = 0.4
    const steps = 20
    const stepSize = targetVolume / steps
    const stepDuration = 25 // 500ms total

    audio.volume = 0

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume < targetVolume - stepSize) {
        audio.volume = Math.min(targetVolume, audio.volume + stepSize)
      } else {
        audio.volume = targetVolume
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
      }
    }, stepDuration)
  }

  // Fade out a track
  const fadeOut = (audio: HTMLAudioElement, onComplete?: () => void) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    const steps = 20
    const stepSize = audio.volume / steps
    const stepDuration = 25 // 500ms total

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > stepSize) {
        audio.volume = Math.max(0, audio.volume - stepSize)
      } else {
        audio.volume = 0
        audio.pause()
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
        onComplete?.()
      }
    }, stepDuration)
  }

  // Handle first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (hasInteractedRef.current) return
      hasInteractedRef.current = true
      console.log('[BgMusic] First interaction detected')
    }

    document.addEventListener('click', handleFirstInteraction, { once: true })
    document.addEventListener('touchend', handleFirstInteraction, { once: true })
    document.addEventListener('keydown', handleFirstInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchend', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  // Toggle mute
  const toggleMute = () => {
    hasInteractedRef.current = true

    setIsMuted(prev => {
      const newMuted = !prev
      localStorage.setItem('bgMusicMuted', String(newMuted))
      console.log('[BgMusic] Mute toggled:', newMuted)
      return newMuted
    })
  }

  // Main music control effect
  useEffect(() => {
    if (!hasInteractedRef.current || !menuAudioRef.current || !queueAudioRef.current) {
      return
    }

    const menuAudio = menuAudioRef.current
    const queueAudio = queueAudioRef.current
    const activeTrack = getActiveTrack()

    console.log('[BgMusic] State:', {
      currentScreen,
      isGameScreen,
      isWaitingScreen,
      isMuted,
      activeTrack,
      menuPlaying: !menuAudio.paused,
      queuePlaying: !queueAudio.paused
    })

    // If muted, stop everything
    if (isMuted) {
      if (!menuAudio.paused) {
        fadeOut(menuAudio)
      }
      if (!queueAudio.paused) {
        fadeOut(queueAudio)
      }
      return
    }

    // If no active track (e.g., in game), stop both
    if (!activeTrack) {
      if (!menuAudio.paused) {
        fadeOut(menuAudio)
      }
      if (!queueAudio.paused) {
        fadeOut(queueAudio)
      }
      return
    }

    // Play the correct track
    const shouldPlayMenu = activeTrack === 'menu'
    const shouldPlayQueue = activeTrack === 'queue'

    // Handle menu audio
    if (shouldPlayMenu) {
      if (menuAudio.paused) {
        menuAudio.play().then(() => {
          console.log('[BgMusic] Menu music started')
          fadeIn(menuAudio)
        }).catch(err => console.error('[BgMusic] Menu play failed:', err))
      }
    } else {
      if (!menuAudio.paused) {
        fadeOut(menuAudio)
      }
    }

    // Handle queue audio
    if (shouldPlayQueue) {
      if (queueAudio.paused) {
        queueAudio.play().then(() => {
          console.log('[BgMusic] Queue music started')
          fadeIn(queueAudio)
        }).catch(err => console.error('[BgMusic] Queue play failed:', err))
      }
    } else {
      if (!queueAudio.paused) {
        fadeOut(queueAudio)
      }
    }
  }, [currentScreen, isGameScreen, isWaitingScreen, isMuted])

  return (
    <BackgroundMusicContext.Provider value={{ isMuted, toggleMute }}>
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
