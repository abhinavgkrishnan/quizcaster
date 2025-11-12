"use client"

import { motion } from "framer-motion"

interface ScoreBarsProps {
  playerScore: number
  opponentScore: number
}

export default function ScoreBars({ playerScore, opponentScore }: ScoreBarsProps) {
  const total = playerScore + opponentScore || 1
  const playerPercentage = (playerScore / total) * 100

  return (
    <div className="absolute inset-0 flex pointer-events-none">
      {/* Player left bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${playerPercentage}%` }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-primary via-primary to-transparent opacity-20"
      />

      {/* Opponent right bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${100 - playerPercentage}%` }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-l from-secondary via-secondary to-transparent opacity-20 ml-auto"
      />
    </div>
  )
}
