"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { User, Menu } from "lucide-react"

interface PlayerHeaderProps {
  playerName: string
  playerScore: number
  playerLevel: string
  playerAvatar: string
  playerFlair?: any
  opponentName: string
  opponentScore: number
  opponentLevel: string
  opponentAvatar: string
  opponentFlair?: any
  timer?: number
  onMenuClick?: () => void
}

export default function PlayerHeader({
  playerName,
  playerScore,
  playerLevel,
  playerAvatar,
  playerFlair,
  opponentName,
  opponentScore,
  opponentLevel,
  opponentAvatar,
  opponentFlair,
  timer,
  onMenuClick,
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
    <div className="flex items-center justify-between gap-2">
      {/* Player */}
      <motion.div
        className="flex items-center gap-2 flex-1 p-2.5 rounded-2xl brutal-violet brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        animate={playerScoreChanged ? {
          y: [-2, 0],
        } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full brutal-white brutal-border-thin flex items-center justify-center overflow-hidden">
            {playerAvatar ? (
              <img
                src={playerAvatar}
                alt={playerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-foreground" />
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] text-foreground/60 font-semibold truncate uppercase tracking-wider">{playerName}</p>
          <div className="h-3">
            {playerFlair && (
              <p className="text-[8px] text-foreground/50 truncate">
                {playerFlair.icon} {playerFlair.name}
              </p>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={playerScore}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="text-xl font-bold text-foreground"
            >
              {playerScore}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Center Menu Button */}
      <button
        onClick={onMenuClick}
        className="flex items-center justify-center w-12 h-12 rounded-full brutal-white brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        style={{
          transform: 'translate3d(0, 0, 0)',
          touchAction: 'manipulation',
        }}
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Opponent */}
      <motion.div
        className="flex items-center justify-end gap-2 flex-1 p-2.5 rounded-2xl brutal-beige brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        animate={opponentScoreChanged ? {
          y: [-2, 0],
        } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[9px] text-foreground/60 font-semibold truncate uppercase tracking-wider">{opponentName}</p>
          <div className="h-3">
            {opponentFlair && (
              <p className="text-[8px] text-foreground/50 truncate">
                {opponentFlair.icon} {opponentFlair.name}
              </p>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={opponentScore}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="text-xl font-bold text-foreground"
            >
              {opponentScore}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full brutal-white brutal-border-thin flex items-center justify-center overflow-hidden">
            {opponentAvatar ? (
              <img
                src={opponentAvatar}
                alt={opponentName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-foreground" />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
