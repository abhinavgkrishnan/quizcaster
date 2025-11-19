"use client"

import { motion } from "framer-motion"
import { Home, Target, Clock, TrendingUp, RotateCcw, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { TEXT } from "@/lib/constants"

interface ChallengeSentScreenProps {
  playerScore: number
  playerAnswers: Array<{ isCorrect: boolean; timeTaken: number; points: number }>
  opponentName: string
  topic: string
  onPlayAgain: () => void
  onGoHome: () => void
  onBack?: () => void
}

export default function ChallengeSentScreen({
  playerScore,
  playerAnswers,
  opponentName,
  topic,
  onPlayAgain,
  onGoHome,
  onBack
}: ChallengeSentScreenProps) {
  const router = useRouter()

  const correctAnswers = playerAnswers.filter(a => a.isCorrect).length
  const totalQuestions = playerAnswers.length
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const avgTime = totalQuestions > 0
    ? (playerAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / totalQuestions / 1000).toFixed(1)
    : "0.0"

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col items-center justify-center bg-card px-6 relative">
      {/* Back button - top left corner */}
      {onBack && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="absolute top-4 left-4 z-10 brutal-border bg-background p-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full"
      >

        {/* Icon */}
        <div className="mb-3 text-center">
          <div className="w-16 h-16 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-3">
            <Clock className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-1">
            {TEXT.CHALLENGE.SENT}
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">
            {TEXT.CHALLENGE.WAITING_FOR(opponentName)}
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-2 mb-2.5 w-full">
          <div className="brutal-violet brutal-border p-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[8px] text-foreground/60 mb-0.5 font-bold uppercase tracking-wider">{TEXT.STATS.YOUR_SCORE}</p>
            <p className="text-2xl font-bold text-foreground">{playerScore}</p>
          </div>
          <div className="brutal-beige brutal-border p-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[8px] text-foreground/60 mb-0.5 font-bold uppercase tracking-wider">{TEXT.STATS.OPPONENT}</p>
            <p className="text-2xl font-bold text-foreground">-</p>
          </div>
        </div>

        {/* Stats */}
        <div className="brutal-white brutal-border p-2.5 rounded-2xl mb-2.5 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-foreground" />
            <p className="text-[10px] text-foreground font-bold uppercase tracking-wide">Stats</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-[9px] uppercase tracking-wide font-semibold">Questions</span>
              <span className="font-bold text-foreground text-[10px]">{correctAnswers} / {totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-[9px] uppercase tracking-wide font-semibold">Avg. Time</span>
              <span className="font-bold text-foreground text-[10px]">{avgTime}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-[9px] uppercase tracking-wide font-semibold">Accuracy</span>
              <span className="font-bold text-foreground text-[10px]">{accuracy}%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-1.5">
          <button
            onClick={onPlayAgain}
            style={{
              transform: 'translate3d(0, 0, 0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className="relative w-full py-2.5 rounded-2xl brutal-beige brutal-border font-bold text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-foreground uppercase tracking-wide"
          >
            <span className="flex items-center justify-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              {TEXT.BUTTONS.PLAY_AGAIN}
            </span>
          </button>

          <button
            onClick={onGoHome}
            style={{
              transform: 'translate3d(0, 0, 0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className="relative w-full py-2.5 rounded-2xl brutal-border bg-background font-bold text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-foreground uppercase tracking-wide"
          >
            <span className="flex items-center justify-center gap-2">
              <Home className="w-3.5 h-3.5" />
              {TEXT.BUTTONS.HOME}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
