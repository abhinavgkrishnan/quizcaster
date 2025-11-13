"use client"

import { useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { Trophy, Target, Zap, RotateCcw } from "lucide-react"
import { GAME_CONFIG } from "@/lib/constants"

interface GameOverProps {
  playerScore: number
  opponentScore: number
  playerAnswers: Array<{
    isCorrect: boolean
    timeTaken: number
    points: number
  }>
  onPlayAgain: () => void
}

export default function GameOver({ playerScore, opponentScore, playerAnswers, onPlayAgain }: GameOverProps) {
  const playerWon = playerScore > opponentScore
  const isDraw = playerScore === opponentScore

  // Calculate real stats from player answers
  const stats = useMemo(() => {
    const questionsAnswered = playerAnswers.length
    const questionsCorrect = playerAnswers.filter(a => a.isCorrect).length
    const totalTime = playerAnswers.reduce((sum, a) => sum + a.timeTaken, 0)
    const avgTime = questionsAnswered > 0 ? totalTime / questionsAnswered : 0
    const accuracy = questionsAnswered > 0 ? (questionsCorrect / questionsAnswered) * 100 : 0

    return {
      questionsAnswered,
      questionsCorrect,
      accuracy: accuracy.toFixed(0),
      avgTimeSeconds: (avgTime / 1000).toFixed(1),
    }
  }, [playerAnswers])

  useEffect(() => {
    if (playerWon) {
      // Minimal confetti - just one burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#CFB8FF', '#FEFFDD', '#000000']
      })
    }
  }, [playerWon])

  return (
    <div className="w-full h-full px-6 py-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center w-full max-w-md"
      >
        {/* Result Icon */}
        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <div className={`w-28 h-28 rounded-full flex items-center justify-center brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
            playerWon ? 'brutal-beige' : isDraw ? 'brutal-violet' : 'bg-gray-300'
          }`}>
            {playerWon ? (
              <Trophy className="w-14 h-14 text-foreground" />
            ) : (
              <Target className="w-14 h-14 text-foreground" />
            )}
          </div>
        </motion.div>

        {/* Result Text */}
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-3 text-foreground uppercase tracking-tight"
        >
          {playerWon ? "Victory!" : isDraw ? "Draw!" : "Defeat"}
        </motion.h2>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm mb-10 uppercase tracking-wide font-semibold"
        >
          {playerWon ? "Outstanding!" : isDraw ? "Evenly matched!" : "Try again!"}
        </motion.p>

        {/* Scores */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4 mb-6 w-full"
        >
          <div className="brutal-violet brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] text-foreground/60 mb-2 font-bold uppercase tracking-wider">Your Score</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.6 }}
              className="text-4xl font-bold text-foreground"
            >
              {playerScore}
            </motion.p>
          </div>
          <div className="brutal-beige brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] text-foreground/60 mb-2 font-bold uppercase tracking-wider">Opponent</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.7 }}
              className="text-4xl font-bold text-foreground"
            >
              {opponentScore}
            </motion.p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="brutal-white brutal-border p-5 rounded-2xl mb-6 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-foreground" />
            <p className="text-sm text-foreground font-bold uppercase tracking-wide">Stats</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Questions</span>
              <span className="font-bold text-foreground text-sm">
                {stats.questionsCorrect} / {stats.questionsAnswered}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Avg. Time</span>
              <span className="font-bold text-foreground text-sm">{stats.avgTimeSeconds}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Accuracy</span>
              <span className="font-bold text-foreground text-sm">{stats.accuracy}%</span>
            </div>
          </div>
        </motion.div>

        {/* Play Again Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, type: "spring" }}
          whileHover={{
            y: -2,
            transition: { type: "spring", stiffness: 500, damping: 15 }
          }}
          whileTap={{
            y: 2,
            transition: { type: "spring", stiffness: 500, damping: 15 }
          }}
          onClick={onPlayAgain}
          className="relative w-full py-5 rounded-2xl brutal-violet brutal-border font-bold text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all text-foreground uppercase tracking-wide"
        >
          <span className="flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Play Again
          </span>
        </motion.button>
      </motion.div>
    </div>
  )
}
