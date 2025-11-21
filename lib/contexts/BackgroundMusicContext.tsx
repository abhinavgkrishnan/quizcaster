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
      if (!hasInteractedRef.current && !isMuted && audioRef.current) {
        hasInteractedRef.current = true
        console.log('[BgMusic] First interaction detected')

        // Only play if we're on a menu screen
        const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
        const shouldBePlaying = menuScreens.includes(currentScreen) && !isGameScreen

        console.log('[BgMusic] Should play on first interaction?', { currentScreen, isGameScreen, shouldBePlaying })

        if (shouldBePlaying) {
          audioRef.current.play().catch(err => console.error('[BgMusic] Play on interaction failed:', err))
        }
      }
    }

    // Listen for any user interaction
    document.addEventListener('click', handleFirstInteraction, { once: true })
    document.addEventListener('touchstart', handleFirstInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [currentScreen, isGameScreen, isMuted])

  // Handle mute/unmute
  const toggleMute = () => {
    hasInteractedRef.current = true // Mark interaction happened

    setIsMuted(prev => {
      const newMutedState = !prev
      localStorage.setItem('bgMusicMuted', String(newMutedState))

      if (audioRef.current) {
        if (newMutedState) {
          // Mute: pause audio
          fadeOut(audioRef.current)
        } else {
          // Unmute: play if on menu screen
          const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
          const shouldBePlaying = menuScreens.includes(currentScreen) && !isGameScreen

          if (shouldBePlaying) {
            audioRef.current.play().catch(err => console.error('[BgMusic] Play failed:', err))
            fadeIn(audioRef.current)
          }
        }
      }

      return newMutedState
    })
  }

  // Fade out helper
  const fadeOut = (audio: HTMLAudioElement) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)

    const startVolume = audio.volume
    const step = startVolume / 10 // 10 steps

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > step) {
        audio.volume = Math.max(0, audio.volume - step)
      } else {
        audio.volume = 0
        audio.pause()
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
      }
    }, 50) // 500ms total fade
  }

  // Fade in helper
  const fadeIn = (audio: HTMLAudioElement) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)

    audio.volume = 0
    const targetVolume = 0.3
    const step = targetVolume / 10 // 10 steps

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume < targetVolume - step) {
        audio.volume = Math.min(targetVolume, audio.volume + step)
      } else {
        audio.volume = targetVolume
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
      }
    }, 50) // 500ms total fade
  }

  // Auto-pause/resume based on screen
  useEffect(() => {
    if (!audioRef.current) return

    // Music should ONLY play on menu screens: topics, profile, leaderboard, friends, challenges
    const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
    const shouldPlay = menuScreens.includes(currentScreen) && !isGameScreen

    console.log('[BgMusic] Screen change:', {
      currentScreen,
      isGameScreen,
      shouldPlay,
      paused: audioRef.current.paused,
      isMuted
    })

    if (!shouldPlay) {
      // Pause music (we're on game/matchmaking/other screen)
      if (!audioRef.current.paused) {
        console.log('[BgMusic] Pausing - not on menu screen')
        fadeOut(audioRef.current)
      }
    } else {
      // Resume music (we're on a menu screen)
      if (audioRef.current.paused && !isMuted && hasInteractedRef.current) {
        console.log('[BgMusic] Resuming - on menu screen')
        audioRef.current.play().catch(err => console.error('[BgMusic] Resume failed:', err))
        fadeIn(audioRef.current)
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
