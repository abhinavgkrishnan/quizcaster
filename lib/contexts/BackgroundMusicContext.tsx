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
  const currentTrackRef = useRef<'menu' | 'queue' | null>(null)
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInteractedRef = useRef(false)

  // Initialize mute preference on mount
  useEffect(() => {
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

      // Immediately update audio volume if playing
      if (audioRef.current) {
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
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = clampedVolume
    }
  }

  // Main music control effect
  useEffect(() => {
    // Don't do anything until user has interacted with the page
    if (!hasInteractedRef.current) {
      console.log('[BgMusic] Waiting for user interaction...')
      return
    }

    const activeTrack = getActiveTrack()

    console.log('[BgMusic] Music state update:', {
      currentScreen,
      isGameScreen,
      isWaitingScreen,
      activeTrack,
      currentTrack: currentTrackRef.current,
      isMuted,
      volume
    })

    // Clean up any pending fade timeout
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }

    // Function to switch tracks
    const switchToTrack = (track: 'menu' | 'queue' | null) => {
      // If switching to the same track, just update volume
      if (track === currentTrackRef.current) {
        if (audioRef.current && track) {
          audioRef.current.volume = isMuted ? 0 : volume
        }
        return
      }

      // Stop current audio with fade out
      if (audioRef.current) {
        const currentAudio = audioRef.current

        // Fade out over 200ms
        let fadeVolume = currentAudio.volume
        const fadeStep = fadeVolume / 10

        const fadeOut = () => {
          if (fadeVolume > 0.01) {
            fadeVolume = Math.max(0, fadeVolume - fadeStep)
            currentAudio.volume = fadeVolume
            fadeTimeoutRef.current = setTimeout(fadeOut, 20)
          } else {
            currentAudio.pause()
            currentAudio.currentTime = 0
            audioRef.current = null

            // Start new track after fade out completes
            startNewTrack(track)
          }
        }

        fadeOut()
      } else {
        // No current track, start new one immediately
        startNewTrack(track)
      }
    }

    // Function to start a new track
    const startNewTrack = (track: 'menu' | 'queue' | null) => {
      currentTrackRef.current = track

      if (!track) {
        // No track to play
        return
      }

      // Create and configure new audio element
      const trackUrl = track === 'menu'
        ? '/sounds/rivalries1.mp3'
        : '/sounds/match-queue.mp3'

      const newAudio = new Audio(trackUrl)
      newAudio.loop = true
      newAudio.volume = 0 // Start at 0 for fade in

      audioRef.current = newAudio

      // Start playing
      newAudio.play()
        .then(() => {
          console.log(`[BgMusic] Started playing ${track} track`)

          // Fade in over 300ms
          let fadeVolume = 0
          const targetVolume = isMuted ? 0 : volume
          const fadeStep = targetVolume / 15

          const fadeIn = () => {
            if (fadeVolume < targetVolume - 0.01) {
              fadeVolume = Math.min(targetVolume, fadeVolume + fadeStep)
              if (audioRef.current === newAudio) { // Check it's still the current audio
                newAudio.volume = fadeVolume
                fadeTimeoutRef.current = setTimeout(fadeIn, 20)
              }
            } else if (audioRef.current === newAudio) {
              newAudio.volume = targetVolume
            }
          }

          fadeIn()
        })
        .catch(err => {
          console.error(`[BgMusic] Failed to play ${track} track:`, err)
          audioRef.current = null
          currentTrackRef.current = null
        })
    }

    // Switch to the active track
    switchToTrack(activeTrack)

    // Cleanup function
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }
    }
  }, [currentScreen, isGameScreen, isWaitingScreen, isMuted, volume])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

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