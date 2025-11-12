"use client"

import { motion } from "framer-motion"

interface GameOverProps {
  playerScore: number
  opponentScore: number
  onPlayAgain: () => void
}

export default function GameOver({ playerScore, opponentScore, onPlayAgain }: GameOverProps) {
  const playerWon = playerScore > opponentScore

  return (
    <div className="w-full max-w-md px-4 py-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center w-full"
      >
        {/* Result */}
        <div className="mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: 2 }}
            className="text-6xl mb-4"
          >
            {playerWon ? "🎉" : "⚔️"}
          </motion.div>
          <h2 className="text-3xl font-bold text-primary mb-2">{playerWon ? "You Win!" : "You Lost"}</h2>
          <p className="text-muted-foreground">Great game!</p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 mb-8 w-full">
          <div className="bg-card rounded-xl p-6 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Your Score</p>
            <p className="text-3xl font-bold text-primary">{playerScore}</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Opponent</p>
            <p className="text-3xl font-bold text-secondary">{opponentScore}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-xl p-4 border border-border mb-8 w-full">
          <p className="text-sm text-muted-foreground mb-3">Performance</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground">Avg. Response Time</span>
              <span className="font-semibold text-primary">2.4s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Accuracy</span>
              <span className="font-semibold text-primary">80%</span>
            </div>
          </div>
        </div>

        {/* Play Again Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Play Again
        </motion.button>
      </motion.div>
    </div>
  )
}
