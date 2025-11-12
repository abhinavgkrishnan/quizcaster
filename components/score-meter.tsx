"use client"

import { motion } from "framer-motion"

interface ScoreMeterProps {
  playerScore: number
  opponentScore: number
}

export default function ScoreMeter({ playerScore, opponentScore }: ScoreMeterProps) {
  const total = playerScore + opponentScore || 1
  const playerPercentage = (playerScore / total) * 100
  const opponentPercentage = (opponentScore / total) * 100

  return (
    <div className="flex items-center gap-3 mb-8">
      {/* Player side */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${playerPercentage}%` }}
        transition={{ duration: 0.5 }}
        className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
      />

      {/* Center indicator */}
      <div className="w-1 h-6 rounded-full bg-border flex-shrink-0" />

      {/* Opponent side */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${opponentPercentage}%` }}
        transition={{ duration: 0.5 }}
        className="h-2 rounded-full bg-gradient-to-r from-secondary to-purple-400 flex-shrink-0 ml-auto"
      />
    </div>
  )
}
