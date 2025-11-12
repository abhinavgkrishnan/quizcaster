"use client"

import { motion } from "framer-motion"

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
  return (
    <div className="flex items-center justify-between gap-2">
      {/* Player 1 */}
      <div className="flex items-center gap-2 flex-1">
        <img
          src={playerAvatar || "/placeholder.svg"}
          alt={playerName}
          className="w-12 h-12 rounded-full border-2 border-primary"
        />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{playerName}</p>
          <p className="text-sm font-bold text-foreground">{playerScore}</p>
        </div>
      </div>

      {/* Timer or level */}
      {timer !== undefined ? (
        <motion.div className="text-center px-3 py-2 rounded-full bg-primary/10 border border-primary/30">
          <div className="text-xs text-muted-foreground">Time</div>
          <div className="text-lg font-bold text-primary">{timer}</div>
        </motion.div>
      ) : (
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Question</div>
        </div>
      )}

      {/* Player 2 */}
      <div className="flex items-center justify-end gap-2 flex-1">
        <div className="min-w-0 text-right">
          <p className="text-xs text-muted-foreground truncate">{opponentName}</p>
          <p className="text-sm font-bold text-foreground">{opponentScore}</p>
        </div>
        <img
          src={opponentAvatar || "/placeholder.svg"}
          alt={opponentName}
          className="w-12 h-12 rounded-full border-2 border-secondary"
        />
      </div>
    </div>
  )
}
