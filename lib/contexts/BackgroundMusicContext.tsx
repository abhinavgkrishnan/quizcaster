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

  // Store muted and volume in refs for access in event handlers
  const isMutedRef = useRef(isMuted)
  const volumeRef = useRef(volume)

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

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

  // Handle first user interaction - CRITICAL for mobile audio
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (hasInteractedRef.current) {
        // Even if we already interacted, check if audio is suspended or paused when it shouldn't be
        if (audioRef.current && shouldPlayMusic() && audioRef.current.paused) {
          try {
            await audioRef.current.play()
            isPlayingRef.current = true
            console.log('[BgMusic] Resumed audio on subsequent interaction')
          } catch (e) {
            console.log('[BgMusic] Failed to resume audio:', e)
          }
        }
        return
      }

      console.log('[BgMusic] First user interaction detected')

      // Try to start audio immediately if we're on a music screen
      if (audioRef.current && shouldPlayMusic()) {
        const audio = audioRef.current
        const targetVolume = isMutedRef.current ? 0 : volumeRef.current

        // IMPORTANT: Set volume to non-zero before playing to prevent iOS from suspending "silent" audio
        // We'll fade it in properly after it starts
        audio.volume = isMutedRef.current ? 0 : 0.01

        try {
          await audio.play()
          console.log('[BgMusic] Audio started on first interaction')
          hasInteractedRef.current = true // Only mark as interacted if play succeeded
          isPlayingRef.current = true

          if (!isMutedRef.current) {
            // Smooth fade in
            fadeAudio(audio, targetVolume, 500)
          }
        } catch (err) {
          // If it fails (e.g. NotAllowedError), we don't set hasInteractedRef to true
          // so we try again on the next click/tap
          console.log('[BgMusic] Failed to start audio (will retry):', err)
        }
      } else {
        // If we shouldn't play music yet, just mark as interacted so we can play later without gesture
        // However, on some browsers we MUST play sound during the gesture to unlock the context.
        // So we might want to play and immediately pause? 
        // For now, let's just mark it.
        hasInteractedRef.current = true
      }
    }

    // Listen for any user interaction - use capture to get events before navigation
    // Added 'touchend' which is often better for audio unlock on iOS
    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown']
    events.forEach(event => {
      // Use capture phase (true) to catch events before they bubble/navigate
      document.addEventListener(event, handleFirstInteraction, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction, true)
      })
    }
  }, [currentScreen, isWaitingScreen, isGameScreen]) // Re-bind if screen changes to ensure fresh closure if needed

  // Toggle mute function
  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    localStorage.setItem('bgMusicMuted', String(newMuted))
    console.log('[BgMusic] Mute toggled:', newMuted)

    // Immediately update audio volume
    const audio = audioRef.current
    if (audio) {
      if (newMuted) {
        // Mute: fade out quickly then set to 0
        fadeAudio(audio, 0, 200)
      } else {
        // Unmute: set to low volume then fade up
        audio.volume = 0.01
        if (isPlayingRef.current) {
          fadeAudio(audio, volume, 300)
        } else {
          // If not playing, try to play
          audio.play().then(() => {
            isPlayingRef.current = true
            fadeAudio(audio, volume, 300)
          }).catch(e => console.error("Failed to play on unmute", e))
        }
      }
    }
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
    // Clear any existing fade
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }

    const startVolume = audio.volume
    const volumeDiff = targetVolume - startVolume

    // If difference is negligible, just set it
    if (Math.abs(volumeDiff) < 0.01) {
      audio.volume = targetVolume
      if (callback) callback()
      return
    }

    const steps = 20
    const stepDuration = duration / steps
    const stepSize = volumeDiff / steps
    let currentStep = 0

    const fade = () => {
      currentStep++
      const newVol = startVolume + (stepSize * currentStep)

      // Ensure we stay within bounds
      audio.volume = Math.max(0, Math.min(1, newVol))

      if (currentStep < steps) {
        fadeTimeoutRef.current = setTimeout(fade, stepDuration)
      } else {
        // Ensure final value is exact
        audio.volume = targetVolume
        fadeTimeoutRef.current = null
        if (callback) callback()
      }
    }

    fade()
  }

  // Main music control effect
  useEffect(() => {
    // Don't do anything until user has interacted (unless we are just updating volume/mute)
    if (!hasInteractedRef.current && shouldPlayMusic()) {
      console.log('[BgMusic] Waiting for first user interaction to start music...')
      return
    }

    if (!audioRef.current) return

    const audio = audioRef.current
    const shouldPlay = shouldPlayMusic()
    const targetVolume = isMuted ? 0 : volume

    // Start or stop music based on screen
    if (shouldPlay) {
      if (!isPlayingRef.current || audio.paused) {
        // Start playing
        // If we haven't interacted yet, this play() might fail, but that's handled by the interaction listener
        const startVol = isMuted ? 0 : 0.01
        audio.volume = startVol

        const playPromise = audio.play()

        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('[BgMusic] Started background music')
            isPlayingRef.current = true
            if (!isMuted) {
              fadeAudio(audio, targetVolume, 500)
            }
          }).catch(err => {
            console.error('[BgMusic] Failed to start music (likely autoplay policy):', err)
            // We don't update isPlayingRef here so we can try again
          })
        }
      } else {
        // Already playing, just update volume if needed (e.g. screen change kept music on)
        if (!isMuted && Math.abs(audio.volume - targetVolume) > 0.05) {
          fadeAudio(audio, targetVolume, 300)
        }
      }
    } else {
      // Should NOT play
      if (isPlayingRef.current || !audio.paused) {
        // Stop playing
        fadeAudio(audio, 0, 200, () => {
          audio.pause()
          isPlayingRef.current = false
          console.log('[BgMusic] Stopped background music')
        })
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