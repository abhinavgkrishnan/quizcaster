"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import GameQuestion from "./game-question"
import ScoreBars from "./score-bars"
import PlayerHeader from "./player-header"
import GameOver from "./game-over"
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

  const currentQuestion = questions[currentQuestionIndex]
  const isFinalQuestion = currentQuestionIndex === questions.length - 1

  // Fetch actual opponent data
  useEffect(() => {
    const fetchOpponent = async () => {
      if (opponent.fid) {
        const response = await fetch(`/api/users/${opponent.fid}`)
        if (response.ok) {
          const data = await response.json()
          setOpponentData({
            fid: data.fid,
            username: data.username,
            displayName: data.display_name,
            pfpUrl: data.pfp_url
          })
        }
      }
    }
    fetchOpponent()
  }, [opponent.fid])

  // Show 2x badge on final question
  useEffect(() => {
    if (isFinalQuestion && !show2xBadge) {
      setShow2xBadge(true)
    }
  }, [isFinalQuestion])

  // Timer countdown
  useEffect(() => {
    if (lastAnswerResult) return

    setTimeRemaining(GAME_CONFIG.QUESTION_TIME_LIMIT)
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleAnswer('', GAME_CONFIG.QUESTION_TIME_LIMIT * 1000)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentQuestionIndex])

  const handleAnswer = async (answer: string, timeTaken: number) => {
    setSaving(true)

    // Save answer to database - the API will check correctness
    const response = await fetch(`/api/matches/${matchId}/answer`, {
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
    setSaving(false)

    // Update score and show result
    const isCorrect = result.is_correct
    const points = result.points_earned || 0
    const correctAnswer = result.correct_answer || ''

    setMyScore(prev => prev + points)
    setLastAnswerResult({ isCorrect, correctAnswer })

    const answerData = {
      questionId: currentQuestion.id,
      answer,
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

    // Show result briefly then move to next question or end game
    setTimeout(() => {
      setLastAnswerResult(null)

      if (isFinalQuestion) {
        // Game complete - mark as complete in DB
        completeGame()
      } else {
        setCurrentQuestionIndex(prev => prev + 1)
      }
    }, 1500)
  }

  const completeGame = async () => {
    // Mark match and update stats
    await fetch(`/api/matches/${matchId}/complete-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid: myPlayer.fid,
        score: myScore
      })
    })

    setIsComplete(true)
  }

  // Show game over screen
  if (isComplete) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-muted">
        <GameOver
          playerScore={myScore}
          opponentScore={0}
          playerAnswers={myAnswers}
          opponent={opponentData}
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
