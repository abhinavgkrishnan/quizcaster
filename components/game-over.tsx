"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { Trophy, Target, Zap, RotateCcw, Home, Swords, Share2 } from "lucide-react"
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
  forfeitedBy?: number | null
  myFid: number
  topic?: string
  onPlayAgain: () => void
  onGoHome: () => void
  onChallenge: () => void
}

export default function GameOver({ playerScore, opponentScore, playerAnswers, opponent, opponentRequestedRematch, forfeitedBy, myFid, topic, onPlayAgain, onGoHome, onChallenge }: GameOverProps) {
  const opponentForfeited = forfeitedBy !== null && forfeitedBy !== myFid
  const iForfeited = forfeitedBy === myFid

  // Forfeit overrides score - forfeiter always loses
  const playerWon = iForfeited ? false : opponentForfeited ? true : playerScore > opponentScore
  const isDraw = !iForfeited && !opponentForfeited && playerScore === opponentScore
  const [challengeProgress, setChallengeProgress] = useState(0)
  const [challengeActive, setChallengeActive] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

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
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#CFB8FF', '#FEFFDD', '#000000']
      })
    }
  }, [playerWon])

  useEffect(() => {
    if (challengeActive) {
      const duration = 10000
      const interval = 50
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

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const result = playerWon ? '🏆 Victory!' : isDraw ? '🤝 Draw!' : '💪 Good game!'
      const topicText = topic ? ` in ${topic}` : ''
      const text = `${result} Just played Quizcaster${topicText}!\n\n📊 Score: ${playerScore} - ${opponentScore}\n✅ Accuracy: ${stats.accuracy}%\n⚡ Avg time: ${stats.avgTimeSeconds}s\n\nThink you can beat me? 👇`

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quizcaster.com'

      // Use Farcaster SDK to open composer
      const { sdk } = await import('@farcaster/miniapp-sdk')

      // Build composer URL
      const composerUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(appUrl)}`

      await sdk.actions.openUrl(composerUrl)
    } catch (error) {
      console.error('Share error:', error)
      alert('Failed to open composer')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="w-full h-screen overflow-hidden flex items-center justify-center px-[5%]">
      <div className="text-center w-full max-w-md flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex flex-col"
        >
          {/* Result Icon */}
          <div className="mb-3 flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              playerWon ? 'brutal-beige' : isDraw ? 'brutal-violet' : 'bg-gray-300'
            }`}>
              {playerWon ? (
                <Trophy className="w-8 h-8 text-foreground" />
              ) : (
                <Target className="w-8 h-8 text-foreground" />
              )}
            </div>
          </div>

          {/* Result Text */}
          <h2 className="text-2xl font-bold mb-1 text-foreground uppercase tracking-tight">
            {playerWon ? "Victory!" : isDraw ? "Draw!" : "Defeat"}
          </h2>

          <p className="text-muted-foreground text-[10px] mb-3 uppercase tracking-wide font-semibold">
            {opponentForfeited
              ? `${opponent.displayName} forfeited!`
              : iForfeited
              ? "You forfeited"
              : playerWon ? "Outstanding!" : isDraw ? "Evenly matched!" : "Try again!"}
          </p>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-2 mb-2.5 w-full">
            <div className="brutal-violet brutal-border p-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[8px] text-foreground/60 mb-0.5 font-bold uppercase tracking-wider">Your Score</p>
              <p className="text-2xl font-bold text-foreground">{playerScore}</p>
            </div>
            <div className="brutal-beige brutal-border p-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[8px] text-foreground/60 mb-0.5 font-bold uppercase tracking-wider">Opponent</p>
              <p className="text-2xl font-bold text-foreground">{opponentScore}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="brutal-white brutal-border p-2.5 rounded-2xl mb-2.5 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-foreground" />
              <p className="text-[10px] text-foreground font-bold uppercase tracking-wide">Stats</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-[9px] uppercase tracking-wide font-semibold">Questions</span>
                <span className="font-bold text-foreground text-[10px]">
                  {stats.questionsCorrect} / {stats.questionsAnswered}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-[9px] uppercase tracking-wide font-semibold">Avg. Time</span>
                <span className="font-bold text-foreground text-[10px]">{stats.avgTimeSeconds}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-[9px] uppercase tracking-wide font-semibold">Accuracy</span>
                <span className="font-bold text-foreground text-[10px]">{stats.accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-1.5">
            <button
              onClick={handleShare}
              disabled={isSharing}
              style={{
                transform: 'translate3d(0, 0, 0)',
                WebkitTransform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              className={`relative w-full py-3 rounded-2xl brutal-violet brutal-border font-bold text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-foreground uppercase tracking-wide ${isSharing ? 'opacity-50' : ''}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                {isSharing ? 'Sharing...' : 'Share Results'}
              </span>
            </button>

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
                Play Again
              </span>
            </button>

            <button
              onClick={handleChallenge}
              disabled={challengeProgress >= 100}
              style={{
                transform: 'translate3d(0, 0, 0)',
                WebkitTransform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                animation: opponentRequestedRematch && !challengeActive ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
              }}
              className={`relative w-full py-2.5 rounded-2xl brutal-border font-bold text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 uppercase tracking-wide overflow-hidden ${
                challengeProgress >= 100 ? 'bg-gray-300 opacity-50' : opponentRequestedRematch ? 'brutal-violet' : 'brutal-beige'
              }`}
            >
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
                    rx="12"
                    style={{
                      transition: 'stroke-dasharray 0.05s linear',
                    }}
                  />
                </svg>
              )}

              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {opponent.pfpUrl && (
                  <img
                    src={opponent.pfpUrl}
                    alt={opponent.displayName}
                    className="w-5 h-5 rounded-full brutal-border flex-shrink-0"
                  />
                )}
                <Swords className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate" style={{ maxWidth: 'calc(100% - 80px)' }}>
                  {opponentRequestedRematch && !challengeActive
                    ? `${opponent.displayName} wants rematch!`
                    : `Challenge ${opponent.displayName}`}
                </span>
                {challengeActive && (
                  <span className="text-[9px] flex-shrink-0">({Math.ceil(10 - (challengeProgress / 10))}s)</span>
                )}
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
                Home
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
