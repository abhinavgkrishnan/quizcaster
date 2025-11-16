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
    <div className="absolute inset-0 flex pointer-events-none overflow-hidden opacity-20">
      {/* Player left bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${playerPercentage}%` }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="relative h-full bg-[#CFB8FF]"
      />

      {/* Opponent right bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${100 - playerPercentage}%` }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="relative h-full ml-auto bg-[#FEFFDD]"
      />
    </div>
  )
}
