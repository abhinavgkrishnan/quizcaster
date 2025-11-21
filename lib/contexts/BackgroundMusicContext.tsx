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
  const menuAudioRef = useRef<HTMLAudioElement | null>(null)
  const queueAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentTrackRef = useRef<'menu' | 'queue' | null>(null)
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInteractedRef = useRef(false)
  const audioPrimedRef = useRef(false)

  // Initialize audio elements once on mount
  useEffect(() => {
    // Create both audio elements
    const menuAudio = new Audio('/sounds/rivalries1.mp3')
    menuAudio.loop = true
    menuAudio.volume = 0
    menuAudioRef.current = menuAudio

    const queueAudio = new Audio('/sounds/match-queue.mp3')
    queueAudio.loop = true
    queueAudio.volume = 0
    queueAudioRef.current = queueAudio

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
      menuAudio.pause()
      queueAudio.pause()
    }
  }, [])

  // Determine which track should be active based on current screen
  const getActiveTrack = (): 'menu' | 'queue' | null => {
    // No music during game screens
    if (isGameScreen) return null

    // Queue music for matchmaking and waiting screens
    if (currentScreen === 'matchmaking' || isWaitingScreen) return 'queue'

    // Menu music for main menu screens
    const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
    if (menuScreens.includes(currentScreen)) return 'menu'

    return null
  }

  // Handle first user interaction - prime BOTH audio elements ONCE
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (hasInteractedRef.current) return
      hasInteractedRef.current = true
      console.log('[BgMusic] First user interaction detected, priming audio elements')

      // Prime both audio elements ONCE
      if (!audioPrimedRef.current && menuAudioRef.current && queueAudioRef.current) {
        audioPrimedRef.current = true

        const menuAudio = menuAudioRef.current
        const queueAudio = queueAudioRef.current

        // Prime both tracks by attempting to play them at volume 0
        // Don't pause them here - let the main effect handle that
        menuAudio.play().catch(err => {
          console.log('[BgMusic] Menu audio prime failed:', err)
        })

        queueAudio.play().catch(err => {
          console.log('[BgMusic] Queue audio prime failed:', err)
        })

        // Pause both immediately after priming
        // The main effect will handle which one should actually play
        setTimeout(() => {
          menuAudio.pause()
          queueAudio.pause()
          console.log('[BgMusic] Audio elements primed and paused')
        }, 100)
      }
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
  }, []) // No dependencies - run only once

  // Toggle mute function
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev
      localStorage.setItem('bgMusicMuted', String(newMuted))
      console.log('[BgMusic] Mute toggled:', newMuted)

      // Immediately update the playing audio's volume
      const activeTrack = currentTrackRef.current
      if (activeTrack === 'menu' && menuAudioRef.current) {
        menuAudioRef.current.volume = newMuted ? 0 : volume
      } else if (activeTrack === 'queue' && queueAudioRef.current) {
        queueAudioRef.current.volume = newMuted ? 0 : volume
      }

      return newMuted
    })
  }

  // Set volume function
  const handleSetVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    localStorage.setItem('bgMusicVolume', String(clampedVolume))

    // Update active audio volume immediately if not muted
    if (!isMuted) {
      const activeTrack = currentTrackRef.current
      if (activeTrack === 'menu' && menuAudioRef.current) {
        menuAudioRef.current.volume = clampedVolume
      } else if (activeTrack === 'queue' && queueAudioRef.current) {
        queueAudioRef.current.volume = clampedVolume
      }
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

    // Wait a bit for audio to be primed
    if (!audioPrimedRef.current) {
      console.log('[BgMusic] Waiting for audio to be primed...')
      return
    }

    if (!menuAudioRef.current || !queueAudioRef.current) {
      console.log('[BgMusic] Audio elements not initialized')
      return
    }

    const menuAudio = menuAudioRef.current
    const queueAudio = queueAudioRef.current
    const activeTrack = getActiveTrack()
    const targetVolume = isMuted ? 0 : volume

    console.log('[BgMusic] Updating music:', {
      currentScreen,
      activeTrack,
      previousTrack: currentTrackRef.current,
      isMuted,
      targetVolume
    })

    // Handle no active track (game screens)
    if (!activeTrack) {
      currentTrackRef.current = null
      // Fade out and pause both
      if (!menuAudio.paused || menuAudio.volume > 0) {
        fadeAudio(menuAudio, 0, 200, () => {
          menuAudio.pause()
          menuAudio.currentTime = 0
        })
      }
      if (!queueAudio.paused || queueAudio.volume > 0) {
        fadeAudio(queueAudio, 0, 200, () => {
          queueAudio.pause()
          queueAudio.currentTime = 0
        })
      }
      return
    }

    // Track change logic
    if (activeTrack !== currentTrackRef.current) {
      // Store the new track immediately to prevent double-switching
      const previousTrack = currentTrackRef.current
      currentTrackRef.current = activeTrack

      // Stop the previous track
      if (previousTrack === 'menu' && (!menuAudio.paused || menuAudio.volume > 0)) {
        fadeAudio(menuAudio, 0, 200, () => {
          menuAudio.pause()
          menuAudio.currentTime = 0
        })
      } else if (previousTrack === 'queue' && (!queueAudio.paused || queueAudio.volume > 0)) {
        fadeAudio(queueAudio, 0, 200, () => {
          queueAudio.pause()
          queueAudio.currentTime = 0
        })
      }

      // Start the new track
      if (activeTrack === 'menu') {
        // Ensure queue is stopped
        if (!queueAudio.paused) {
          queueAudio.pause()
          queueAudio.currentTime = 0
          queueAudio.volume = 0
        }

        // Start menu music
        if (menuAudio.paused) {
          menuAudio.volume = 0
          menuAudio.play()
            .then(() => {
              console.log('[BgMusic] Started menu music')
              fadeAudio(menuAudio, targetVolume, 300)
            })
            .catch(err => {
              console.error('[BgMusic] Failed to start menu music:', err)
              currentTrackRef.current = null
            })
        } else {
          fadeAudio(menuAudio, targetVolume, 300)
        }
      } else if (activeTrack === 'queue') {
        // Ensure menu is stopped
        if (!menuAudio.paused) {
          menuAudio.pause()
          menuAudio.currentTime = 0
          menuAudio.volume = 0
        }

        // Start queue music
        if (queueAudio.paused) {
          queueAudio.volume = 0
          queueAudio.play()
            .then(() => {
              console.log('[BgMusic] Started queue music')
              fadeAudio(queueAudio, targetVolume, 300)
            })
            .catch(err => {
              console.error('[BgMusic] Failed to start queue music:', err)
              currentTrackRef.current = null
            })
        } else {
          fadeAudio(queueAudio, targetVolume, 300)
        }
      }
    }
    // Just update volume if track hasn't changed
    else if (activeTrack === currentTrackRef.current) {
      if (activeTrack === 'menu' && !menuAudio.paused) {
        fadeAudio(menuAudio, targetVolume, 200)
      } else if (activeTrack === 'queue' && !queueAudio.paused) {
        fadeAudio(queueAudio, targetVolume, 200)
      }
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