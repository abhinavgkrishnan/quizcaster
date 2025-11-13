"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { Trophy, Target, Zap, RotateCcw, Home, Swords } from "lucide-react"
import { GAME_CONFIG } from "@/lib/constants"

interface GameOverProps {
  playerScore: number
  opponentScore: number
  playerAnswers: Array<{
    isCorrect: boolean
    timeTaken: number
    points: number
  }>
  opponent: {
    username: string
    displayName: string
    pfpUrl?: string
  }
  opponentRequestedRematch: boolean
  onPlayAgain: () => void
  onGoHome: () => void
  onChallenge: () => void
}

export default function GameOver({ playerScore, opponentScore, playerAnswers, opponent, opponentRequestedRematch, onPlayAgain, onGoHome, onChallenge }: GameOverProps) {
  const playerWon = playerScore > opponentScore
  const isDraw = playerScore === opponentScore
  const [challengeProgress, setChallengeProgress] = useState(0)
  const [challengeActive, setChallengeActive] = useState(false)

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

  // Challenge timer (10 seconds)
  useEffect(() => {
    if (challengeActive) {
      const duration = 10000 // 10 seconds
      const interval = 50 // Update every 50ms
      const steps = duration / interval
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        setChallengeProgress((currentStep / steps) * 100)

        if (currentStep >= steps) {
          clearInterval(timer)
          setChallengeActive(false)
          setChallengeProgress(0)
        }
      }, interval)

      return () => clearInterval(timer)
    }
  }, [challengeActive])

  const handleChallenge = () => {
    setChallengeActive(true)
    onChallenge()
  }

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

        {/* Action Buttons */}
        <div className="w-full space-y-3">
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

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: opponentRequestedRematch && !challengeActive ? [1, 1.02, 1] : 1,
            }}
            transition={{
              delay: 1.1,
              type: "spring",
              scale: {
                repeat: opponentRequestedRematch && !challengeActive ? Infinity : 0,
                duration: 1,
              }
            }}
            onClick={handleChallenge}
            disabled={challengeProgress >= 100}
            className={`relative w-full py-4 rounded-2xl brutal-border font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide overflow-hidden ${
              challengeProgress >= 100 ? 'bg-gray-300 opacity-50' : opponentRequestedRematch ? 'brutal-violet animate-pulse' : 'brutal-beige'
            }`}
          >
            {/* Circular Progress Bar - starts from top middle, goes clockwise */}
            {challengeActive && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <rect
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  fill="none"
                  stroke="#CFB8FF"
                  strokeWidth="4"
                  strokeDasharray={`${challengeProgress * 2}% ${200 - challengeProgress * 2}%`}
                  strokeDashoffset="50%"
                  rx="14"
                  style={{
                    transition: 'stroke-dasharray 0.05s linear',
                  }}
                />
              </svg>
            )}

            <span className="relative z-10 flex items-center justify-center gap-2">
              {opponent.pfpUrl && (
                <img
                  src={opponent.pfpUrl}
                  alt={opponent.displayName}
                  className="w-6 h-6 rounded-full brutal-border"
                />
              )}
              <Swords className="w-4 h-4" />
              <span className="truncate max-w-[150px]">
                {opponentRequestedRematch && !challengeActive
                  ? `${opponent.displayName} wants rematch!`
                  : `Challenge ${opponent.displayName}`}
              </span>
              {challengeActive && (
                <span className="text-xs">({Math.ceil(10 - (challengeProgress / 10))}s)</span>
              )}
            </span>
          </motion.button>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, type: "spring" }}
            whileHover={{
              y: -2,
              transition: { type: "spring", stiffness: 500, damping: 15 }
            }}
            whileTap={{
              y: 2,
              transition: { type: "spring", stiffness: 500, damping: 15 }
            }}
            onClick={onGoHome}
            className="relative w-full py-4 rounded-2xl brutal-border bg-background font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all text-foreground uppercase tracking-wide"
          >
            <span className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
