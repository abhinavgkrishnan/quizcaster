"use client"

import { motion } from "framer-motion"
import { Clock, Trophy, User } from "lucide-react"
import type { PlayerData } from "@/lib/socket/events"

interface AsyncPendingScreenProps {
  myPlayer: PlayerData
  opponent?: PlayerData
  myScore: number
  topic: string
  onGoHome: () => void
}

export default function AsyncPendingScreen({
  myPlayer,
  opponent,
  myScore,
  topic,
  onGoHome
}: AsyncPendingScreenProps) {
  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col items-center justify-center bg-card p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full brutal-beige brutal-border flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Clock className="w-12 h-12 text-foreground" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground mb-2">
          Challenge Sent!
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-8">
          Waiting for {opponent?.displayName || 'opponent'}
        </p>

        {/* Your Score Card */}
        <div className="brutal-violet brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 max-w-sm mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full brutal-border overflow-hidden">
              {myPlayer.pfpUrl ? (
                <img src={myPlayer.pfpUrl} alt={myPlayer.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-background flex items-center justify-center">
                  <User className="w-8 h-8 text-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">{myPlayer.displayName}</p>
              <p className="text-xs text-foreground/60 uppercase tracking-wider">{topic}</p>
            </div>
          </div>

          <div className="flex items-center justify-between brutal-border-thin border-t pt-4">
            <div className="text-left">
              <p className="text-xs text-foreground/60 uppercase tracking-wider">Your Score</p>
              <p className="text-3xl font-bold text-foreground">{myScore}</p>
            </div>
            <Trophy className="w-10 h-10 text-foreground/30" />
          </div>
        </div>

        {/* Info Text */}
        <div className="brutal-white brutal-border p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-8 max-w-sm mx-auto">
          <p className="text-xs text-foreground/70 leading-relaxed">
            Your opponent will be notified to play their match. You'll be notified when they complete it!
          </p>
        </div>

        {/* Actions */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onGoHome}
          className="brutal-beige brutal-border px-8 py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className="text-sm font-bold uppercase tracking-wider">Back to Home</p>
        </motion.button>
      </motion.div>
    </div>
  )
}
