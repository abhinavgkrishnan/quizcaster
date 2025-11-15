"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import GameQuestion from "./game-question"
import GameOver from "./game-over"
import PlayerHeader from "./player-header"
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
  const [showingChallengerAnswer, setShowingChallengerAnswer] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [lastAnswerResult, setLastAnswerResult] = useState<{ isCorrect: boolean } | null>(null)

  // Calculate challenger's current score up to current question
  useEffect(() => {
    const score = challengerAnswers
      .slice(0, currentQuestionIndex + 1)
      .reduce((sum, a) => sum + a.points, 0)
    setChallengerScore(score)
  }, [currentQuestionIndex, challengerAnswers])

  const currentQuestion = questions[currentQuestionIndex]
  const isFinalQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswer = async (answer: string, timeTaken: number) => {
    // Save answer via API to get correct validation
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
    const isCorrect = result.is_correct || false
    const points = result.points_earned || 0

    // Update my score
    setMyScore(prev => prev + points)

    // Store my answer
    const myAnswer = {
      isCorrect,
      timeTaken,
      points
    }
    setMyAnswers(prev => [...prev, myAnswer])

    // Show result
    setLastAnswerResult({ isCorrect })

    // Confetti if correct
    if (isCorrect) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#CFB8FF', '#FEFFDD', '#000000']
      })
    }

    // After showing my result, show challenger's answer
    setTimeout(() => {
      setShowingChallengerAnswer(true)

      // Then move to next question or end game
      setTimeout(() => {
        setShowingChallengerAnswer(false)
        setLastAnswerResult(null)

        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1)
        } else {
          // Game complete
          completeGame()
        }
      }, 2000) // Show challenger answer for 2 seconds
    }, 1500) // Show my result for 1.5 seconds first
  }

  const completeGame = async () => {
    setGameComplete(true)

    // Mark opponent completion and trigger stats update + notification
    try {
      await fetch(`/api/matches/${matchId}/complete-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: myPlayer.fid,
          score: myScore
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
      {/* Main Game Layout */}
      <div className="flex flex-col h-full px-[4%] py-4">
        {/* Header with scores */}
        <div className="mb-4">
          <PlayerHeader
            playerName={myPlayer.username}
            playerScore={myScore}
            playerLevel="Player"
            playerAvatar={myPlayer.pfpUrl || ''}
            playerFlair={myPlayer.activeFlair}
            opponentName={challenger.username}
            opponentScore={challengerScore}
            opponentLevel="Challenger"
            opponentAvatar={challenger.pfpUrl || ''}
            opponentFlair={challenger.activeFlair}
            onMenuClick={() => {}}
          />
        </div>

        {/* Question progress */}
        <div className="flex justify-center gap-1.5 mb-4">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx < currentQuestionIndex
                  ? 'w-4 bg-violet-500'
                  : idx === currentQuestionIndex
                  ? 'w-8 bg-violet-500'
                  : 'w-4 bg-foreground/20'
              }`}
            />
          ))}
        </div>

        {/* Async indicator */}
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Async Challenge • Question {currentQuestionIndex + 1}/{questions.length}
            {isFinalQuestion && ' • 2X POINTS'}
          </p>
        </div>

        {/* Question */}
        <div className="flex-1 flex items-start justify-center overflow-hidden">
          {!showingChallengerAnswer ? (
            <GameQuestion
              key={`question-${currentQuestion.id}`}
              question={currentQuestion}
              onAnswer={handleAnswer}
              isDisabled={showingChallengerAnswer}
              showResult={lastAnswerResult !== null}
              wasCorrect={lastAnswerResult?.isCorrect ?? null}
              correctAnswer={lastAnswerResult ? challengerAnswers[currentQuestionIndex]?.answer : undefined}
              timeRemaining={GAME_CONFIG.QUESTION_TIME_LIMIT}
            />
          ) : (
            <ChallengerAnswerReveal
              challengerName={challenger.displayName}
              challengerAnswer={challengerAnswers[currentQuestionIndex]}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Component to show challenger's answer
function ChallengerAnswerReveal({
  challengerName,
  challengerAnswer
}: {
  challengerName: string
  challengerAnswer: ChallengerAnswer
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-md"
    >
      <div className={`brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
        challengerAnswer.isCorrect ? 'brutal-violet' : 'brutal-beige'
      }`}>
        <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2 text-center">
          {challengerName}'s Answer
        </p>
        <p className="text-xl font-bold text-foreground mb-2 text-center">
          "{challengerAnswer.answer}"
        </p>
        <div className="flex items-center justify-center gap-4 pt-3 border-t brutal-border-thin">
          <div className="text-center">
            <p className="text-xs text-foreground/60 uppercase tracking-wider">Result</p>
            <p className="text-sm font-bold text-foreground">
              {challengerAnswer.isCorrect ? '✓ Correct' : '✗ Wrong'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-foreground/60 uppercase tracking-wider">Points</p>
            <p className="text-sm font-bold text-foreground">
              +{challengerAnswer.points}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-foreground/60 uppercase tracking-wider">Time</p>
            <p className="text-sm font-bold text-foreground">
              {(challengerAnswer.timeTaken / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
