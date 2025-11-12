"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Timer from "./timer"

interface GameQuestionProps {
  question: {
    id: number
    question: string
    options: string[]
    correct: string
    image?: string
  }
  onAnswer: (isCorrect: boolean, timeToAnswer: number) => void
  answered: boolean
}

export default function GameQuestion({ question, onAnswer, answered }: GameQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [startTime] = useState(Date.now())

  const handleSelectAnswer = (option: string) => {
    if (answered) return

    const timeToAnswer = Date.now() - startTime
    const isCorrect = option === question.correct

    setSelectedAnswer(option)
    onAnswer(isCorrect, timeToAnswer)
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Timer - positioned at top */}
      <div className="flex justify-center pt-2">
        <Timer onTimeout={() => onAnswer(false, 10000)} />
      </div>

      {/* Question Text */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground leading-tight text-balance">{question.question}</h2>
      </div>

      {/* Image if present */}
      {question.image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-border bg-muted flex-shrink-0"
        >
          <img
            src={question.image || "/placeholder.svg"}
            alt="Question visual"
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Options Grid */}
      <div className={`flex-1 flex flex-col justify-end gap-3 ${question.image ? "" : ""}`}>
        {question.options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={!answered ? { scale: 1.02 } : {}}
            whileTap={!answered ? { scale: 0.98 } : {}}
            onClick={() => handleSelectAnswer(option)}
            disabled={answered}
            className={`w-full p-4 rounded-xl font-semibold transition-all text-center flex-1 ${
              selectedAnswer === option
                ? option === question.correct
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-red-500 text-white shadow-lg"
                : "bg-white text-foreground border-2 border-border hover:border-primary hover:bg-primary/5"
            } disabled:cursor-default`}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
