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

    // Start playing if not muted
    if (!shouldBeMuted) {
      audio.play().catch(err => console.error('[BgMusic] Autoplay failed:', err))
    }

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }
      audio.pause()
      audio.src = ''
    }
  }, [])

  // Handle mute/unmute
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMutedState = !prev
      localStorage.setItem('bgMusicMuted', String(newMutedState))

      if (audioRef.current) {
        if (newMutedState) {
          // Fade out and pause
          fadeOut(audioRef.current)
        } else {
          // Resume and fade in (if not on game screen)
          const shouldBePlaying = !isGameScreen &&
            currentScreen !== 'matchmaking' &&
            currentScreen !== 'matchFound' &&
            currentScreen !== 'game'

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
    if (!audioRef.current || isMuted) return

    const shouldPause =
      isGameScreen ||
      currentScreen === 'matchmaking' ||
      currentScreen === 'matchFound' ||
      currentScreen === 'game'

    if (shouldPause) {
      // Fade out and pause
      if (!audioRef.current.paused) {
        fadeOut(audioRef.current)
      }
    } else {
      // Resume and fade in
      if (audioRef.current.paused) {
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
