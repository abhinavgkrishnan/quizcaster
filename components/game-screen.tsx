"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import GameQuestion from "./game-question"
import GameOver from "./game-over"
import PlayerHeader from "./player-header"
import ScoreBars from "./score-bars"

interface GameScreenProps {
  topic: string
  onGameEnd: () => void
}

const QUESTIONS = [
  {
    id: 1,
    question: "Who painted the Mona Lisa?",
    options: ["Leonardo da Vinci", "Van Gogh", "Gauguin", "Matisse"],
    correct: "Leonardo da Vinci",
    image: "/mona-lisa-painting.jpg",
  },
  {
    id: 2,
    question: "Which of these would be most likely to use a metronome?",
    options: ["Musician", "Carpenter", "Architect", "Surgeon"],
    correct: "Musician",
  },
  {
    id: 3,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: "Paris",
    image: "/eiffel-tower-paris.jpg",
  },
  {
    id: 4,
    question: "In what year did the Titanic sink?",
    options: ["1912", "1920", "1905", "1915"],
    correct: "1912",
  },
  {
    id: 5,
    question: "What is the fastest land animal?",
    options: ["Lion", "Greyhound", "Cheetah", "Pronghorn"],
    correct: "Cheetah",
    image: "/cheetah-running.jpg",
  },
]

export default function GameScreen({ topic, onGameEnd }: GameScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [answered, setAnswered] = useState(false)

  const handleAnswer = (isCorrect: boolean, timeToAnswer: number) => {
    if (answered) return

    setAnswered(true)

    if (isCorrect) {
      const points = calculatePoints(timeToAnswer)
      setPlayerScore((prev) => prev + points)

      const opponentPoints = Math.floor(Math.random() * 20)
      setOpponentScore((prev) => prev + opponentPoints)
    }

    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setAnswered(false)
      } else {
        setGameOver(true)
      }
    }, 1500)
  }

  const calculatePoints = (timeMs: number) => {
    const timeSec = timeMs / 1000
    if (timeSec < 1) return 20
    if (timeSec < 2) return 18
    if (timeSec < 3) return 16
    if (timeSec < 4) return 14
    if (timeSec < 5) return 12
    if (timeSec < 10) return 10
    return 0
  }

  if (gameOver) {
    return <GameOver playerScore={playerScore} opponentScore={opponentScore} onPlayAgain={onGameEnd} />
  }

  const question = QUESTIONS[currentQuestion]

  return (
    <div className="relative w-full max-w-md px-4 py-4 flex flex-col h-screen bg-background overflow-hidden">
      <ScoreBars playerScore={playerScore} opponentScore={opponentScore} />

      <div className="relative z-10 mb-4">
        <PlayerHeader
          playerName="You"
          playerScore={playerScore}
          playerLevel="Novice"
          playerAvatar="/diverse-user-avatars.png"
          opponentName="Opponent"
          opponentScore={opponentScore}
          opponentLevel="Beginner"
          opponentAvatar="/avatar-opponent.jpg"
          timer={Math.ceil((QUESTIONS.length - currentQuestion) / 2)}
        />
      </div>

      {/* Question Counter */}
      <div className="relative z-10 text-center mb-2">
        <p className="text-xs text-muted-foreground">
          Question {currentQuestion + 1} of {QUESTIONS.length}
        </p>
      </div>

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex-1 flex flex-col justify-center pb-4"
        >
          <GameQuestion question={question} onAnswer={handleAnswer} answered={answered} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
