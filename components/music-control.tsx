"use client"

import { motion } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { useBackgroundMusic } from "@/lib/contexts/BackgroundMusicContext"
import { useAppContext } from "@/lib/contexts/AppContext"

export default function MusicControl() {
  const { isMuted, toggleMute } = useBackgroundMusic()
  const { isGameScreen, currentScreen } = useAppContext()

  // Only show button on menu screens where music plays
  const menuScreens = ['topics', 'profile', 'leaderboard', 'friends', 'challenges']
  const shouldShowButton = menuScreens.includes(currentScreen) && !isGameScreen

  if (!shouldShowButton) {
    return null
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleMute}
      className="fixed top-4 right-4 z-50 w-12 h-12 brutal-white brutal-border rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center bg-card hover:bg-secondary transition-colors"
      aria-label={isMuted ? "Unmute background music" : "Mute background music"}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-foreground" />
      ) : (
        <Volume2 className="w-5 h-5 text-foreground" />
      )}
    </motion.button>
  )
}
