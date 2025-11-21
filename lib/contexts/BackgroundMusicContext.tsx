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
      menuAudio.volume = 0
      queueAudio.volume = 0
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

  // Fade to a target volume
  const fadeTo = (audio: HTMLAudioElement, targetVolume: number) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    const steps = 20
    const currentVolume = audio.volume
    const volumeDiff = targetVolume - currentVolume
    const stepSize = volumeDiff / steps
    const stepDuration = 25 // 500ms total

    if (Math.abs(volumeDiff) < 0.01) {
      audio.volume = targetVolume
      return
    }

    fadeIntervalRef.current = setInterval(() => {
      const remaining = Math.abs(targetVolume - audio.volume)
      if (remaining > Math.abs(stepSize)) {
        audio.volume = Math.max(0, Math.min(1, audio.volume + stepSize))
      } else {
        audio.volume = targetVolume
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
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

  // Start audio playback on first interaction
  useEffect(() => {
    if (!hasInteractedRef.current || !menuAudioRef.current || !queueAudioRef.current) {
      return
    }

    const menuAudio = menuAudioRef.current
    const queueAudio = queueAudioRef.current

    // Start both tracks playing (muted initially)
    if (menuAudio.paused) {
      menuAudio.play().catch(err => console.error('[BgMusic] Menu play failed:', err))
    }
    if (queueAudio.paused) {
      queueAudio.play().catch(err => console.error('[BgMusic] Queue play failed:', err))
    }
  }, [hasInteractedRef.current])

  // Main music control effect - only controls volume, never pauses
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
      menuVolume: menuAudio.volume,
      queueVolume: queueAudio.volume
    })

    // If muted, fade both to 0
    if (isMuted) {
      fadeTo(menuAudio, 0)
      fadeTo(queueAudio, 0)
      return
    }

    // If no active track (e.g., in game), fade both to 0
    if (!activeTrack) {
      fadeTo(menuAudio, 0)
      fadeTo(queueAudio, 0)
      return
    }

    // Fade to the correct track
    if (activeTrack === 'menu') {
      fadeTo(menuAudio, 0.4)
      fadeTo(queueAudio, 0)
    } else if (activeTrack === 'queue') {
      fadeTo(menuAudio, 0)
      fadeTo(queueAudio, 0.4)
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
