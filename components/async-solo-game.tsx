"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import GameQuestion from "./game-question"
import ScoreBars from "./score-bars"
import PlayerHeader from "./player-header"
import ChallengeSentScreen from "./challenge-sent-screen"
import type { PlayerData, Question } from "@/lib/types"
import { GAME_CONFIG } from "@/lib/constants"

interface AsyncSoloGameProps {
  matchId: string
  myPlayer: PlayerData
  opponent: PlayerData
  topic: string
  questions: Question[]
  onGameEnd: () => void
}

export default function AsyncSoloGame({
  matchId,
  myPlayer,
  opponent,
  topic,
  questions,
  onGameEnd
}: AsyncSoloGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [myAnswers, setMyAnswers] = useState<any[]>([])
  const [lastAnswerResult, setLastAnswerResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME_CONFIG.QUESTION_TIME_LIMIT)
  const [opponentData, setOpponentData] = useState(opponent)
  const [isComplete, setIsComplete] = useState(false)
  const [show2xBadge, setShow2xBadge] = useState(false)
  const [gameInitialized, setGameInitialized] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        console.error('[AsyncSolo] Failed to initialize game:', error)
      }
    }
    initGame()
  }, [matchId, myPlayer.fid])

  // Safety check for question index
  const safeIndex = Math.min(currentQuestionIndex, questions.length - 1)
  const currentQuestion = questions[safeIndex]
  const isFinalQuestion = safeIndex === questions.length - 1

  // Fetch actual opponent data with flair
  useEffect(() => {
    const fetchOpponent = async () => {
      if (opponent.fid && !opponent.displayName) {
        // Only fetch if not already provided in props
        const [userRes, flairRes] = await Promise.all([
          fetch(`/api/users/${opponent.fid}`),
          fetch(`/api/flairs?fid=${opponent.fid}`)
        ])
        if (userRes.ok) {
          const userData = await userRes.json()
          const flairData = await flairRes.json()
          setOpponentData({
            fid: userData.fid,
            username: userData.username,
            displayName: userData.display_name,
            pfpUrl: userData.pfp_url,
            activeFlair: flairData.active_flair
          })
        }
      } else if (opponent.displayName) {
        // Use data from props
        setOpponentData(opponent)
      }
    }
    fetchOpponent()
  }, [opponent])

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
    if (isSubmitting) return // Prevent duplicate submissions

    try {
      setIsSubmitting(true)
      // Stop timer
      setTimeRemaining(0)

      console.log('[AsyncSolo] Submitting answer for Q', safeIndex + 1, 'isFinal:', isFinalQuestion)

      // Save answer to database
      const response = await fetch(`/api/matches/${matchId}/answer-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: myPlayer.fid,
          question_id: currentQuestion.id,
          question_number: safeIndex,
          answer,
          time_taken_ms: timeTaken
        })
      })

      if (!response.ok) {
        console.error('[AsyncSolo] Answer API error:', await response.text())
        return
      }

      const result = await response.json()
      console.log('[AsyncSolo] Answer result:', result)

      const isCorrect = result.isCorrect || false
      const points = result.points || 0
      const correctAnswer = result.correct_answer || ''

      // Use scores from API (calculated from Redis) instead of client-side calculation
      setMyScore(result.playerScore || 0)
      // Opponent score stays 0 in solo async (opponent hasn't played yet)
      setLastAnswerResult({ isCorrect, correctAnswer })

      const answerData = {
        isCorrect,
        timeTaken,
        points
      }
      setMyAnswers(prev => [...prev, answerData])

      if (isCorrect) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 }
        })
      }

      console.log('[AsyncSolo] Is final?', isFinalQuestion, 'Current:', currentQuestionIndex, 'Total:', questions.length)

      // Show result briefly then move to next question or end game
      setTimeout(() => {
        setLastAnswerResult(null)
        setIsSubmitting(false)

        if (isFinalQuestion) {
          console.log('[AsyncSolo] Completing game')
          completeGame()
        } else {
          console.log('[AsyncSolo] Moving to next question')
          setCurrentQuestionIndex(prev => prev + 1)
        }
      }, 1500)
    } catch (error) {
      console.error('[AsyncSolo] Error in handleAnswer:', error)
      setIsSubmitting(false)
    }
  }

  const completeGame = async () => {
    // Mark match and update stats (score is calculated from answers in DB)
    await fetch(`/api/matches/${matchId}/complete-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid: myPlayer.fid
      })
    })

    setIsComplete(true)
  }

  // Show challenge sent screen when complete
  if (isComplete) {
    return (
      <ChallengeSentScreen
        playerScore={myScore}
        playerAnswers={myAnswers}
        opponentName={opponentData.displayName}
        topic={topic}
        onPlayAgain={() => {
          // Navigate to matchmaking for same topic
          window.location.href = `/?matchmaking=${topic}`
        }}
        onGoHome={onGameEnd}
      />
    )
  }

  return (
    <div className="relative w-full h-screen bg-muted overflow-hidden">
      <div className="w-full max-w-md mx-auto px-[4%] py-[3%] h-full flex flex-col">
        {/* Score bars */}
        <ScoreBars playerScore={myScore} opponentScore={0} />

        {/* Player header */}
        <div className="relative z-10 mb-2 flex-shrink-0">
          <PlayerHeader
            playerName={myPlayer.displayName || myPlayer.username}
            playerScore={myScore}
            playerLevel="Novice"
            playerAvatar={myPlayer.pfpUrl || ""}
            playerFlair={(myPlayer as any).activeFlair}
            opponentName={opponentData.displayName || opponentData.username}
            opponentScore={0}
            opponentLevel="Waiting"
            opponentAvatar={opponentData.pfpUrl || ""}
            opponentFlair={(opponentData as any).activeFlair}
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
                Question {safeIndex + 1} of {questions.length}
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
          {currentQuestion && (
            <GameQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              isDisabled={false}
              showResult={lastAnswerResult !== null}
              wasCorrect={lastAnswerResult?.isCorrect || null}
              correctAnswer={lastAnswerResult?.correctAnswer}
              timeRemaining={timeRemaining}
            />
          )}
        </div>
      </div>
    </div>
  )
}
