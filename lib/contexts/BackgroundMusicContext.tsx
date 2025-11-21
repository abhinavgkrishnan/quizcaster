"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useAppContext } from "./AppContext"

interface BackgroundMusicContextType {
  isMuted: boolean
  toggleMute: () => void
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType | undefined>(undefined)

export function BackgroundMusicProvider({ children }: { children: ReactNode }) {
  const { isGameScreen, currentScreen } = useAppContext()
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInteractedRef = useRef(false)

  // Initialize audio and load mute preference
  useEffect(() => {
    // Create audio element
    const audio = new Audio('/sounds/rivalries1.mp3')
    audio.loop = true
    audio.volume = 0.4
    audioRef.current = audio

    // Load mute preference from localStorage
    const savedMutedState = localStorage.getItem('bgMusicMuted')
    const shouldBeMuted = savedMutedState === 'true'
    setIsMuted(shouldBeMuted)

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // Handle first user interaction to start audio (autoplay policy)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteractedRef.current && audioRef.current) {
        hasInteractedRef.current = true
        console.log('[BgMusic] First interaction detected, isMuted:', isMuted)

        // Check if we should play at this moment
        const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
        const shouldBePlaying = menuScreens.includes(currentScreen) && !isGameScreen && !isMuted

        console.log('[BgMusic] First interaction check:', {
          currentScreen,
          isGameScreen,
          isMuted,
          shouldBePlaying,
          audioExists: !!audioRef.current
        })

        if (shouldBePlaying) {
          const playPromise = audioRef.current.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log('[BgMusic] Started playing on first interaction'))
              .catch(err => console.error('[BgMusic] Play on interaction failed:', err))
          }
        }
      }
    }

    // Listen for any user interaction
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('touchend', handleFirstInteraction) // Changed from touchstart to touchend
    document.addEventListener('keydown', handleFirstInteraction)

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchend', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [currentScreen, isGameScreen, isMuted])

  // Handle mute/unmute
  const toggleMute = () => {
    hasInteractedRef.current = true // Mark interaction happened
    console.log('[BgMusic] toggleMute called')

    setIsMuted(prev => {
      const newMutedState = !prev
      localStorage.setItem('bgMusicMuted', String(newMutedState))

      console.log('[BgMusic] Toggle mute:', {
        from: prev,
        to: newMutedState,
        audioExists: !!audioRef.current,
        currentScreen,
        isGameScreen
      })

      if (audioRef.current) {
        if (newMutedState) {
          // Mute: pause audio
          console.log('[BgMusic] Muting audio')
          fadeOut(audioRef.current)
        } else {
          // Unmute: play if on menu screen
          const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
          const shouldBePlaying = menuScreens.includes(currentScreen) && !isGameScreen

          console.log('[BgMusic] Unmuting, shouldPlay:', shouldBePlaying)

          if (shouldBePlaying) {
            const playPromise = audioRef.current.play()
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('[BgMusic] Unmute play succeeded')
                  fadeIn(audioRef.current!)
                })
                .catch(err => console.error('[BgMusic] Unmute play failed:', err))
            }
          }
        }
      }

      return newMutedState
    })
  }

  // Fade out helper
  const fadeOut = (audio: HTMLAudioElement) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }

    const startVolume = audio.volume
    const step = startVolume / 10 // 10 steps

    fadeIntervalRef.current = setInterval(() => {
      if (!audio || audio.paused) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
        return
      }

      if (audio.volume > step) {
        audio.volume = Math.max(0, audio.volume - step)
      } else {
        audio.volume = 0
        audio.pause()
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
      }
    }, 50) // 500ms total fade
  }

  // Fade in helper
  const fadeIn = (audio: HTMLAudioElement) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }

    audio.volume = 0
    const targetVolume = 0.4
    const step = targetVolume / 10 // 10 steps

    fadeIntervalRef.current = setInterval(() => {
      if (!audio || audio.paused) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
        return
      }

      if (audio.volume < targetVolume - step) {
        audio.volume = Math.min(targetVolume, audio.volume + step)
      } else {
        audio.volume = targetVolume
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
      }
    }, 50) // 500ms total fade
  }

  // Auto-pause/resume based on screen
  useEffect(() => {
    if (!audioRef.current) return

    // Music should ONLY play on menu screens: topics, profile, leaderboard, friends, challenges
    const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
    const shouldPlay = menuScreens.includes(currentScreen) && !isGameScreen && !isMuted

    console.log('[BgMusic] Screen change:', {
      currentScreen,
      isGameScreen,
      isMuted,
      shouldPlay,
      paused: audioRef.current.paused,
      hasInteracted: hasInteractedRef.current
    })

    if (!shouldPlay) {
      // MUST pause music (we're on game/matchmaking/other screen, OR muted)
      if (!audioRef.current.paused) {
        console.log('[BgMusic] Pausing with fade - not on menu screen or muted')
        fadeOut(audioRef.current)
      }
      // Extra safeguard: force pause immediately if in game (critical for mobile)
      if (isGameScreen && !audioRef.current.paused) {
        console.log('[BgMusic] Force pausing - in game screen')
        audioRef.current.pause()
      }
    } else {
      // Resume music (we're on a menu screen, not muted, user interacted)
      if (audioRef.current.paused && hasInteractedRef.current) {
        console.log('[BgMusic] Resuming - on menu screen')
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[BgMusic] Resume succeeded')
              fadeIn(audioRef.current!)
            })
            .catch(err => console.error('[BgMusic] Resume failed:', err))
        }
      }
    }
  }, [isGameScreen, currentScreen, isMuted])

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
