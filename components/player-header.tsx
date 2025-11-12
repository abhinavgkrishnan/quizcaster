"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { User, Users } from "lucide-react"

interface PlayerHeaderProps {
  playerName: string
  playerScore: number
  playerLevel: string
  playerAvatar: string
  opponentName: string
  opponentScore: number
  opponentLevel: string
  opponentAvatar: string
  timer?: number
}

export default function PlayerHeader({
  playerName,
  playerScore,
  playerLevel,
  playerAvatar,
  opponentName,
  opponentScore,
  opponentLevel,
  opponentAvatar,
  timer,
}: PlayerHeaderProps) {
  const [prevPlayerScore, setPrevPlayerScore] = useState(playerScore)
  const [prevOpponentScore, setPrevOpponentScore] = useState(opponentScore)
  const [playerScoreChanged, setPlayerScoreChanged] = useState(false)
  const [opponentScoreChanged, setOpponentScoreChanged] = useState(false)

  useEffect(() => {
    if (playerScore !== prevPlayerScore) {
      setPlayerScoreChanged(true)
      setTimeout(() => setPlayerScoreChanged(false), 400)
      setPrevPlayerScore(playerScore)
    }
  }, [playerScore, prevPlayerScore])

  useEffect(() => {
    if (opponentScore !== prevOpponentScore) {
      setOpponentScoreChanged(true)
      setTimeout(() => setOpponentScoreChanged(false), 400)
      setPrevOpponentScore(opponentScore)
    }
  }, [opponentScore, prevOpponentScore])

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Player */}
      <motion.div
        className="flex items-center gap-3 flex-1 p-3 rounded-2xl brutal-violet brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        animate={playerScoreChanged ? {
          y: [-2, 0],
        } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full brutal-white brutal-border-thin flex items-center justify-center overflow-hidden">
            {playerAvatar ? (
              <img
                src={playerAvatar}
                alt={playerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-foreground" />
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-foreground/60 font-semibold truncate uppercase tracking-wider">{playerName}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={playerScore}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="text-2xl font-bold text-foreground"
            >
              {playerScore}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Center indicator */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full brutal-white brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <Users className="w-5 h-5 text-foreground" />
      </div>

      {/* Opponent */}
      <motion.div
        className="flex items-center justify-end gap-3 flex-1 p-3 rounded-2xl brutal-beige brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        animate={opponentScoreChanged ? {
          y: [-2, 0],
        } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[10px] text-foreground/60 font-semibold truncate uppercase tracking-wider">{opponentName}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={opponentScore}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="text-2xl font-bold text-foreground"
            >
              {opponentScore}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="relative">
          <div className="w-12 h-12 rounded-full brutal-white brutal-border-thin flex items-center justify-center overflow-hidden">
            {opponentAvatar ? (
              <img
                src={opponentAvatar}
                alt={opponentName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-foreground" />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
