"use client"

import { motion } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { useBackgroundMusic } from "@/lib/contexts/BackgroundMusicContext"
import { useAppContext } from "@/lib/contexts/AppContext"

export default function MusicControl() {
  const { isMuted, toggleMute } = useBackgroundMusic()
  const { isGameScreen, currentScreen, isWaitingScreen } = useAppContext()

  // Show button on all screens where music can play
  // Hide only during actual gameplay
  const shouldShowButton = !isGameScreen

  if (!shouldShowButton) {
    return null
  }

  const handleToggle = () => {
    console.log('[MusicControl] Toggle clicked')
    toggleMute()
  }

  // Determine if music is currently active on this screen
  const isMusicActive = (() => {
    if (currentScreen === 'matchmaking' || isWaitingScreen) {
      return true // Queue music screens
    }
    const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
    if (menuScreens.includes(currentScreen)) {
      return true // Menu music screens
    }
    return false
  })()

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      className={`fixed top-4 right-4 z-50 w-12 h-12 brutal-white brutal-border rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all duration-200 touch-manipulation ${isMusicActive
          ? 'bg-card hover:bg-secondary active:bg-secondary'
          : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-200 opacity-60'
        }`}
      aria-label={isMuted ? "Unmute background music" : "Mute background music"}
      title={isMuted ? "Unmute background music" : "Mute background music"}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-foreground" />
      ) : (
        <Volume2 className="w-5 h-5 text-foreground" />
      )}
    </motion.button>
  )
}