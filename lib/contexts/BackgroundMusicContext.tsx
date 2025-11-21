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
  const currentTrackRef = useRef<'menu' | 'queue' | null>(null)

  // Initialize both audio tracks and load mute preference
  useEffect(() => {
    // Create menu music audio element
    const menuAudio = new Audio('/sounds/rivalries1.mp3')
    menuAudio.loop = true
    menuAudio.volume = 0.4
    menuAudio.dataset.originalSrc = '/sounds/rivalries1.mp3'
    menuAudioRef.current = menuAudio

    // Create queue music audio element
    const queueAudio = new Audio('/sounds/match-queue.mp3')
    queueAudio.loop = true
    queueAudio.volume = 0.4
    queueAudio.dataset.originalSrc = '/sounds/match-queue.mp3'
    queueAudioRef.current = queueAudio

    // Load mute preference from localStorage
    const savedMutedState = localStorage.getItem('bgMusicMuted')
    const shouldBeMuted = savedMutedState === 'true'
    setIsMuted(shouldBeMuted)

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }
      // Clean up both audio tracks
      if (menuAudioRef.current) {
        menuAudioRef.current.pause()
        menuAudioRef.current.currentTime = 0
        menuAudioRef.current.src = ''
        menuAudioRef.current.load()
      }
      if (queueAudioRef.current) {
        queueAudioRef.current.pause()
        queueAudioRef.current.currentTime = 0
        queueAudioRef.current.src = ''
        queueAudioRef.current.load()
      }
      // Clear Media Session metadata to remove from phone controls
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null
      }
    }
  }, [])

  // Helper to determine which track should play based on current screen
  const getActiveAudio = (): HTMLAudioElement | null => {
    // Queue music for matchmaking screen and waiting screens
    if (currentScreen === 'matchmaking' || isWaitingScreen) {
      return queueAudioRef.current
    }
    // Menu music for menu screens
    const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
    if (menuScreens.includes(currentScreen) && !isGameScreen) {
      return menuAudioRef.current
    }
    return null
  }

  // Helper to switch between tracks
  const switchTrack = async (newTrack: 'menu' | 'queue' | null) => {
    if (newTrack === currentTrackRef.current) return

    console.log('[BgMusic] Switching track:', currentTrackRef.current, '->', newTrack)

    // Fade out current track if playing
    if (currentTrackRef.current === 'menu' && menuAudioRef.current && !menuAudioRef.current.paused) {
      fadeOut(menuAudioRef.current)
    } else if (currentTrackRef.current === 'queue' && queueAudioRef.current && !queueAudioRef.current.paused) {
      fadeOut(queueAudioRef.current)
    }

    currentTrackRef.current = newTrack

    // Fade in new track if not muted and has interacted
    if (newTrack && !isMuted && hasInteractedRef.current) {
      const audio = newTrack === 'menu' ? menuAudioRef.current : queueAudioRef.current
      if (audio) {
        // Restore source if needed
        if (!audio.src && audio.dataset.originalSrc) {
          audio.src = audio.dataset.originalSrc
          audio.load()
        }
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => fadeIn(audio))
            .catch(err => console.error('[BgMusic] Track switch play failed:', err))
        }
      }
    }
  }

  // Handle first user interaction to start audio (autoplay policy)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        console.log('[BgMusic] First interaction detected, isMuted:', isMuted)

        const activeAudio = getActiveAudio()
        const shouldBePlaying = !!activeAudio && !isMuted

        console.log('[BgMusic] First interaction check:', {
          currentScreen,
          isGameScreen,
          isMuted,
          shouldBePlaying,
          activeAudioType: activeAudio === menuAudioRef.current ? 'menu' : activeAudio === queueAudioRef.current ? 'queue' : 'none'
        })

        if (shouldBePlaying && activeAudio) {
          // Determine which track
          const trackType = activeAudio === menuAudioRef.current ? 'menu' : 'queue'
          currentTrackRef.current = trackType

          // Restore source if it was cleared
          if (!activeAudio.src && activeAudio.dataset.originalSrc) {
            console.log('[BgMusic] Restoring audio source')
            activeAudio.src = activeAudio.dataset.originalSrc
            activeAudio.load()
          }

          const playPromise = activeAudio.play()
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

      const activeAudio = getActiveAudio()

      console.log('[BgMusic] Toggle mute:', {
        from: prev,
        to: newMutedState,
        activeAudioType: activeAudio === menuAudioRef.current ? 'menu' : activeAudio === queueAudioRef.current ? 'queue' : 'none',
        currentScreen,
        isGameScreen
      })

      if (activeAudio) {
        if (newMutedState) {
          // Mute: pause active audio
          console.log('[BgMusic] Muting audio')
          fadeOut(activeAudio)
        } else {
          // Unmute: play active audio
          console.log('[BgMusic] Unmuting')

          // Restore source if it was cleared
          if (!activeAudio.src && activeAudio.dataset.originalSrc) {
            console.log('[BgMusic] Restoring audio source')
            activeAudio.src = activeAudio.dataset.originalSrc
            activeAudio.load()
          }

          const playPromise = activeAudio.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('[BgMusic] Unmute play succeeded')
                fadeIn(activeAudio)
              })
              .catch(err => console.error('[BgMusic] Unmute play failed:', err))
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
        audio.currentTime = 0

        // CRITICAL: Clear audio source to fully stop and remove from phone media controls
        // This removes the audio from iOS/Android lock screen and notification media controls
        const currentSrc = audio.src
        audio.src = ''
        audio.load()

        // Store the original source so we can restore it later
        audio.dataset.originalSrc = currentSrc

        // Clear Media Session metadata to remove from lock screen controls
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = null
        }

        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }

        console.log('[BgMusic] Audio fully stopped and cleared from media controls')
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

  // Auto-pause/resume based on screen and switch tracks
  useEffect(() => {
    if (!menuAudioRef.current || !queueAudioRef.current) return

    // Determine which track should play
    let targetTrack: 'menu' | 'queue' | null = null

    // Queue music for matchmaking and waiting screens
    if ((currentScreen === 'matchmaking' || isWaitingScreen) && !isMuted) {
      targetTrack = 'queue'
    } else {
      const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
      if (menuScreens.includes(currentScreen) && !isGameScreen && !isMuted) {
        targetTrack = 'menu'
      }
    }

    console.log('[BgMusic] Screen change:', {
      currentScreen,
      isGameScreen,
      isWaitingScreen,
      isMuted,
      currentTrack: currentTrackRef.current,
      targetTrack,
      hasInteracted: hasInteractedRef.current
    })

    // Only proceed if user has interacted (autoplay policy)
    if (!hasInteractedRef.current && targetTrack) {
      console.log('[BgMusic] Waiting for first interaction')
      return
    }

    // Switch tracks if needed
    if (targetTrack !== currentTrackRef.current) {
      switchTrack(targetTrack)
    }
  }, [isGameScreen, currentScreen, isMuted, isWaitingScreen])

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
