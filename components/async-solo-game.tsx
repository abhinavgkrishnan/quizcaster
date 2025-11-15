"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import type { PlayerData, Question } from "@/lib/types"
import { calculatePoints } from "@/lib/utils/scoring"
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
  const [lastAnswerResult, setLastAnswerResult] = useState<{ isCorrect: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isFinalQuestion = currentQuestionIndex === questions.length - 1

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
    const points = result.points_earned

    setMyScore(prev => prev + points)
    setLastAnswerResult({ isCorrect })

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

    onGameEnd()
  }

  return (
    <div className="w-full h-screen flex flex-col bg-card">
      {/* Player Headers */}
      <div className="flex-none">
        <div className="flex items-center justify-between p-4 bg-secondary border-b-2 border-black">
          {/* My Player */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full brutal-border overflow-hidden bg-white">
              {myPlayer.pfpUrl ? (
                <img src={myPlayer.pfpUrl} alt={myPlayer.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-violet-200" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{myPlayer.displayName}</p>
              <p className="text-lg font-bold text-foreground">{myScore}</p>
            </div>
          </div>

          {/* VS */}
          <div className="text-xs font-bold text-muted-foreground uppercase">VS</div>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-bold text-foreground text-right">{opponent.displayName}</p>
              <p className="text-xs font-bold text-muted-foreground text-right uppercase tracking-wide">Waiting</p>
            </div>
            <div className="w-10 h-10 rounded-full brutal-border overflow-hidden bg-white">
              {opponent.pfpUrl ? (
                <img src={opponent.pfpUrl} alt={opponent.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-secondary border-b-2 border-black">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wide">
              Question {currentQuestionIndex + 1}/{questions.length}
            </span>
            {isFinalQuestion && (
              <span className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Final Question - 2x Points!
              </span>
            )}
          </div>
          <div className="w-full h-2 brutal-border rounded-full overflow-hidden bg-white">
            <div
              className="h-full brutal-violet transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question - using same GameQuestion component */}
      <div className="flex-1 overflow-hidden">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col p-4"
          >
            {/* Question Text */}
            <div className="flex-none mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {currentQuestion.question}
              </h2>
              {currentQuestion.imageUrl && (
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question"
                  className="w-full max-h-48 object-contain rounded-lg brutal-border"
                />
              )}
            </div>

            {/* Options */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const endTime = Date.now()
                    const timeTaken = 5000 // Placeholder - implement timer
                    handleAnswer(option, timeTaken)
                  }}
                  disabled={saving || lastAnswerResult !== null}
                  className={`w-full brutal-white brutal-border p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left font-bold hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                    saving || lastAnswerResult !== null ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>

            {/* Result Feedback */}
            {lastAnswerResult && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`absolute inset-0 flex items-center justify-center ${
                  lastAnswerResult.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                <div className={`brutal-border rounded-2xl p-8 ${
                  lastAnswerResult.isCorrect ? 'brutal-violet' : 'bg-red-100'
                }`}>
                  <p className="text-3xl font-bold text-foreground">
                    {lastAnswerResult.isCorrect ? '✓ Correct!' : '✗ Wrong'}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
