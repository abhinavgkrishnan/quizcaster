"use client"

import { motion } from "framer-motion"
import { Home, Target, Clock, TrendingUp, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

interface ChallengeSentScreenProps {
  playerScore: number
  playerAnswers: Array<{ isCorrect: boolean; timeTaken: number; points: number }>
  opponentName: string
  topic: string
  onPlayAgain: () => void
  onGoHome: () => void
}

export default function ChallengeSentScreen({
  playerScore,
  playerAnswers,
  opponentName,
  topic,
  onPlayAgain,
  onGoHome
}: ChallengeSentScreenProps) {
  const router = useRouter()

  const correctAnswers = playerAnswers.filter(a => a.isCorrect).length
  const totalQuestions = playerAnswers.length
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const avgTime = totalQuestions > 0
    ? (playerAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / totalQuestions / 1000).toFixed(1)
    : "0.0"

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col items-center justify-center bg-card px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full"
      >
        {/* Icon */}
        <div className="mb-6 text-center">
          <div className="w-24 h-24 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
            <span className="text-5xl">📤</span>
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground mb-2">
            Challenge Sent!
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Waiting for {opponentName}
          </p>
        </div>

        {/* Your Score */}
        <div className="brutal-violet brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
          <p className="text-xs text-foreground/60 uppercase tracking-wider mb-1 text-center">Your Score</p>
          <p className="text-5xl font-bold text-foreground text-center">{playerScore}</p>
        </div>

        {/* Stats */}
        <div className="brutal-white brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Stats</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Questions</span>
              <span className="text-sm font-bold text-foreground">{correctAnswers}/{totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg. Time</span>
              <span className="text-sm font-bold text-foreground">{avgTime}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Accuracy</span>
              <span className="text-sm font-bold text-foreground">{accuracy}%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onPlayAgain}
            className="w-full py-4 rounded-2xl brutal-beige brutal-border font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-foreground uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onGoHome}
            className="w-full py-4 rounded-2xl brutal-white brutal-border font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-foreground uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
