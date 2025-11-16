"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Swords } from "lucide-react"
import type { PlayerData } from "@/lib/socket/events"

interface MatchFoundProps {
  topic: string
  myPlayer: PlayerData
  opponent: PlayerData
  onAnimationComplete?: () => void
}

export default function MatchFound({ topic, myPlayer, opponent, onAnimationComplete }: MatchFoundProps) {
  useEffect(() => {
    // Auto-transition after animation
    const timer = setTimeout(() => {
      onAnimationComplete?.()
    }, 3000) // 3 second display

    return () => clearTimeout(timer)
  }, [onAnimationComplete])

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex items-center justify-center bg-card p-6">
      <div className="w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-block"
          >
            <Swords className="w-16 h-16 text-foreground mx-auto mb-4" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold uppercase tracking-wider text-foreground"
          >
            {topic ? 'Challenge Accepted!' : 'Match Found!'}
          </motion.h1>
        </motion.div>

        {/* Players Display */}
        <div className="flex items-center justify-between gap-4 mb-8 px-4">
          {/* My Player */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.6 }}
            className="flex-1"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full brutal-violet brutal-border overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {myPlayer.pfpUrl ? (
                  <img
                    src={myPlayer.pfpUrl}
                    alt={myPlayer.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-500" />
                )}
              </div>
              <div className="text-center min-h-[60px] flex flex-col justify-start px-2">
                <p className="text-base font-bold text-foreground truncate max-w-[120px]">
                  {myPlayer.displayName}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide truncate max-w-[120px]">
                  @{myPlayer.username}
                </p>
                <div className="h-4 mt-1">
                  {myPlayer.activeFlair && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="text-[10px] text-foreground/70"
                    >
                      {myPlayer.activeFlair.icon} {myPlayer.activeFlair.name}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* VS */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.9 }}
            className="flex-none"
          >
            <p className="text-5xl font-black uppercase tracking-wider text-foreground" style={{
              textShadow: '4px 4px 0px rgba(0,0,0,0.3), 2px 2px 0px rgba(0,0,0,0.2)'
            }}>
              VS
            </p>
          </motion.div>

          {/* Opponent */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.6 }}
            className="flex-1"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full brutal-beige brutal-border overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {opponent.pfpUrl ? (
                  <img
                    src={opponent.pfpUrl}
                    alt={opponent.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-300" />
                )}
              </div>
              <div className="text-center min-h-[60px] flex flex-col justify-start px-2">
                <p className="text-base font-bold text-foreground truncate max-w-[120px]">
                  {opponent.displayName}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide truncate max-w-[120px]">
                  @{opponent.username}
                </p>
                <div className="h-4 mt-1">
                  {opponent.activeFlair && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="text-[10px] text-foreground/70"
                    >
                      {opponent.activeFlair.icon} {opponent.activeFlair.name}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Starting match...
          </p>
          <motion.div
            className="flex justify-center gap-1 mt-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-foreground rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
