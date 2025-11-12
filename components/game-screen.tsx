"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import GameQuestion from "./game-question"
import GameOver from "./game-over"
import PlayerHeader from "./player-header"
import ScoreBars from "./score-bars"
import { useGame } from "@/lib/hooks/useGame"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
}

interface GameScreenProps {
  topic: string
  onGameEnd: () => void
  user: FarcasterUser | null
}

interface Question {
  id: string
  question: string
  options: string[]
  imageUrl?: string | null
}

export default function GameScreen({ topic, onGameEnd, user }: GameScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [matchId, setMatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { createMatch, submitAnswer, completeMatch } = useGame()

  // Create match and fetch questions on mount
  useEffect(() => {
    const initGame = async () => {
      // Use mock FID in dev mode if user is null
      const playerFid = user?.fid || 999999

      try {
        const matchData = await createMatch('bot', topic, playerFid)

        if (matchData) {
          setMatchId(matchData.match_id)
          setQuestions(matchData.questions)
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to initialize game:', error)
        setLoading(false)
      }
    }

    initGame()
  }, [topic, user?.fid])

  const handleAnswer = async (answer: string, timeToAnswer: number) => {
    if (answered || !matchId) return

    const playerFid = user?.fid || 999999

    setAnswered(true)

    try {
      const question = questions[currentQuestion]

      // Submit answer to API
      const result = await submitAnswer(
        matchId,
        playerFid,
        question.id,
        currentQuestion + 1,
        answer,
        timeToAnswer
      )

      // Update scores from API response
      setPlayerScore(result.player_score)
      setOpponentScore(result.opponent_score)

      // Show confetti if correct
      if (result.is_correct) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#CFB8FF', '#FEFFDD', '#000000']
        })
      }

      // Move to next question or end game
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1)
          setAnswered(false)
        } else {
          // Complete match
          completeMatchAndEnd()
        }
      }, 1500)
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const completeMatchAndEnd = async () => {
    if (!matchId) return

    const playerFid = user?.fid || 999999

    try {
      await completeMatch(matchId, playerFid)
      setGameOver(true)
    } catch (error) {
      console.error('Error completing match:', error)
      setGameOver(true)
    }
  }

  if (loading) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-3 h-3 rounded-full bg-foreground" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
            Loading game...
          </p>
        </div>
      </div>
    )
  }

  if (!questions.length || !matchId) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-muted">
        <div className="text-center px-6">
          <p className="text-foreground font-bold text-lg mb-4">Failed to load game</p>
          <button
            onClick={onGameEnd}
            className="brutal-violet brutal-border px-6 py-3 rounded-2xl font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Back to Topics
          </button>
        </div>
      </div>
    )
  }

  if (gameOver) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-muted">
        <GameOver
          playerScore={playerScore}
          opponentScore={opponentScore}
          onPlayAgain={onGameEnd}
        />
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="relative w-full max-w-md mx-auto px-3 py-3 flex flex-col h-screen overflow-hidden bg-muted">
      {/* Score bars background */}
      <ScoreBars playerScore={playerScore} opponentScore={opponentScore} />

      {/* Player header */}
      <div className="relative z-10 mb-3">
        <PlayerHeader
          playerName={user?.displayName || user?.username || "You"}
          playerScore={playerScore}
          playerLevel="Novice"
          playerAvatar={user?.pfpUrl || ""}
          opponentName="Opponent"
          opponentScore={opponentScore}
          opponentLevel="Beginner"
          opponentAvatar=""
          timer={Math.ceil((questions.length - currentQuestion) / 2)}
        />
      </div>

      {/* Question Counter */}
      <div className="relative z-10 text-center mb-2">
        <motion.div
          key={currentQuestion}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block brutal-white brutal-border px-4 py-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </motion.div>
      </div>

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="relative z-10 flex-1 flex flex-col justify-center pb-4"
        >
          <GameQuestion
            question={{
              id: question.id,
              question: question.question,
              options: question.options,
              image: question.imageUrl
            }}
            onAnswer={handleAnswer}
            answered={answered}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
