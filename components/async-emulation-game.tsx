"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import GameQuestion from "./game-question"
import GameOver from "./game-over"
import PlayerHeader from "./player-header"
import ScoreBars from "./score-bars"
import type { PlayerData, Question } from "@/lib/socket/events"
import { GAME_CONFIG } from "@/lib/constants"
import { calculatePoints } from "@/lib/utils/scoring"

interface ChallengerAnswer {
  questionId: string
  answer: string
  isCorrect: boolean
  timeTaken: number
  points: number
}

interface AsyncEmulationGameProps {
  matchId: string
  myPlayer: PlayerData
  challenger: PlayerData
  questions: Question[]
  challengerAnswers: ChallengerAnswer[]
  topic: string
  onGameEnd: () => void
}

export default function AsyncEmulationGame({
  matchId,
  myPlayer,
  challenger,
  questions,
  challengerAnswers,
  topic,
  onGameEnd
}: AsyncEmulationGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [challengerScore, setChallengerScore] = useState(0)
  const [myAnswers, setMyAnswers] = useState<any[]>([])
  const [gameComplete, setGameComplete] = useState(false)
  const [lastAnswerResult, setLastAnswerResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null)
  const [gameInitialized, setGameInitialized] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME_CONFIG.QUESTION_TIME_LIMIT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [show2xBadge, setShow2xBadge] = useState(false)

  // Initialize Redis session on mount
  useEffect(() => {
    const initGame = async () => {
      try {
        await fetch(`/api/matches/${matchId}/start-async`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid: myPlayer.fid })
        })
        setGameInitialized(true)
      } catch (error) {
        console.error('[AsyncEmulation] Failed to initialize game:', error)
      }
    }
    initGame()
  }, [matchId, myPlayer.fid])

  const currentQuestion = questions[currentQuestionIndex]
  const isFinalQuestion = currentQuestionIndex === questions.length - 1

  // Show 2x badge on final question
  useEffect(() => {
    if (isFinalQuestion && !show2xBadge) {
      setShow2xBadge(true)
    }
  }, [isFinalQuestion])

  // Timer countdown - wait for options to load before starting
  useEffect(() => {
    if (lastAnswerResult || isSubmitting) return

    setTimeRemaining(GAME_CONFIG.QUESTION_TIME_LIMIT)

    // Wait for options to load (OPTIONS_LOAD_DELAY + TIMER_START_BUFFER)
    const totalDelay = GAME_CONFIG.OPTIONS_LOAD_DELAY + GAME_CONFIG.TIMER_START_BUFFER
    let interval: NodeJS.Timeout

    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            handleAnswer('', GAME_CONFIG.QUESTION_TIME_LIMIT * 1000)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, totalDelay)

    return () => {
      clearTimeout(startTimer)
      if (interval) clearInterval(interval)
    }
  }, [currentQuestionIndex, lastAnswerResult, isSubmitting])

  const handleAnswer = async (answer: string, timeTaken: number) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setTimeRemaining(0)

    // Save answer via API
    const response = await fetch(`/api/matches/${matchId}/answer-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid: myPlayer.fid,
        question_id: currentQuestion.id,
        question_number: currentQuestionIndex,
        answer,
        time_taken_ms: timeTaken
      })
    })

    const result = await response.json()
    const isCorrect = result.isCorrect || false
    const points = result.points || 0
    const correctAnswer = result.correct_answer || ''

    // Update scores from API - challenger score updates from their recorded answers
    setMyScore(result.playerScore || 0)
    setChallengerScore(result.opponentScore || 0)

    // Store my answer
    setMyAnswers(prev => [...prev, { isCorrect, timeTaken, points }])

    // Show result
    setLastAnswerResult({ isCorrect, correctAnswer })

    if (isCorrect) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 }
      })
    }

    // Show result briefly then move to next question or end
    setTimeout(() => {
      setLastAnswerResult(null)
      setIsSubmitting(false)

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        completeGame()
      }
    }, 1500)
  }

  const completeGame = async () => {
    setGameComplete(true)

    // Mark opponent completion and trigger stats update + notification (score calculated from DB)
    try {
      await fetch(`/api/matches/${matchId}/complete-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: myPlayer.fid
        })
      })
    } catch (error) {
      console.error('Failed to save game results:', error)
    }
  }

  if (gameComplete) {
    const finalChallengerScore = challengerAnswers.reduce((sum, a) => sum + a.points, 0)

    return (
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-muted">
        <GameOver
          playerScore={myScore}
          opponentScore={finalChallengerScore}
          playerAnswers={myAnswers}
          opponent={challenger}
          opponentRequestedRematch={false}
          forfeitedBy={null}
          myFid={myPlayer.fid}
          onPlayAgain={() => {}}
          onGoHome={onGameEnd}
          onChallenge={() => {}}
        />
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-muted overflow-hidden">
      <div className="w-full max-w-md mx-auto px-[4%] py-[3%] h-full flex flex-col">
        {/* Score bars */}
        <ScoreBars playerScore={myScore} opponentScore={challengerScore} />

        {/* Player header */}
        <div className="relative z-10 mb-2 flex-shrink-0">
          <PlayerHeader
            playerName={myPlayer.displayName || myPlayer.username}
            playerScore={myScore}
            playerLevel="Novice"
            playerAvatar={myPlayer.pfpUrl || ""}
            playerFlair={(myPlayer as any).activeFlair}
            opponentName={challenger.displayName || challenger.username}
            opponentScore={challengerScore}
            opponentLevel="Challenger"
            opponentAvatar={challenger.pfpUrl || ""}
            opponentFlair={(challenger as any).activeFlair}
            timer={Math.ceil(timeRemaining)}
            onMenuClick={() => {}}
          />
        </div>

        {/* Question Counter with 2X Badge */}
        <div className="relative z-10 text-center mb-1.5 flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            <motion.div
              key={currentQuestionIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block brutal-white brutal-border px-4 py-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </motion.div>

            {/* 2X Badge for Final Question */}
            <AnimatePresence>
              {show2xBadge && (
                <motion.div
                  initial={{ scale: 3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="brutal-violet brutal-border px-3 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                    2X Points
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Question */}
        <div className="relative z-10 flex-1">
          <GameQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            isDisabled={false}
            showResult={lastAnswerResult !== null}
            wasCorrect={lastAnswerResult?.isCorrect || null}
            correctAnswer={lastAnswerResult?.correctAnswer}
            timeRemaining={timeRemaining}
          />
        </div>
      </div>
    </div>
  )
}
