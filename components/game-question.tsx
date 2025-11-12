"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import Timer from "./timer"
import { Check, X } from "lucide-react"

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
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showOptions, setShowOptions] = useState(false)

  // Reset and show options with delay
  useEffect(() => {
    setShowOptions(false)
    setStartTime(null)
    setSelectedAnswer(null)

    const timer = setTimeout(() => {
      setShowOptions(true)
      setStartTime(Date.now())
    }, 500)

    return () => clearTimeout(timer)
  }, [question.id])

  const handleSelectAnswer = (option: string) => {
    if (answered || !startTime) return

    const timeToAnswer = Date.now() - startTime
    const isCorrect = option === question.correct

    setSelectedAnswer(option)

    // Less confetti - only 30 particles
    if (isCorrect) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#CFB8FF', '#FEFFDD', '#000000']
      })
    }

    onAnswer(isCorrect, timeToAnswer)
  }

  const hasImage = !!question.image

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Timer */}
      <div className="flex justify-center pt-2">
        <Timer
          onTimeout={() => onAnswer(false, 10000)}
          isPaused={!showOptions}
        />
      </div>

      {/* Question Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center px-4"
      >
        <h2 className="text-2xl font-bold text-foreground leading-tight text-balance">
          {question.question}
        </h2>
      </motion.div>

      {/* Image if present */}
      {question.image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <img
            src={question.image || "/placeholder.svg"}
            alt="Question visual"
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Options */}
      <div className={`flex-1 flex flex-col justify-end pb-4 ${hasImage ? 'gap-2' : 'gap-3'}`}>
        <div className={hasImage ? 'grid grid-cols-2 grid-rows-2 gap-3' : 'flex flex-col gap-3'}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrect = option === question.correct
            const showCorrect = answered && isCorrect
            const showWrong = answered && isSelected && !isCorrect

            return (
              <motion.button
                key={option}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={showOptions ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: showOptions ? index * 0.04 : 0
                }}
                whileHover={!answered ? {
                  y: -2,
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                } : {}}
                whileTap={!answered ? {
                  y: 2,
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                } : {}}
                onClick={() => handleSelectAnswer(option)}
                disabled={answered || !showOptions}
                className={`relative ${hasImage ? 'h-full' : ''}`}
              >
                <motion.div
                  animate={showWrong ? {
                    x: [-4, 4, -4, 4, 0],
                  } : {}}
                  transition={{ duration: 0.4 }}
                  className={`
                    relative ${hasImage ? 'h-full' : ''} w-full ${hasImage ? 'p-4' : 'p-5'} rounded-2xl font-bold ${hasImage ? 'text-sm' : 'text-base'} brutal-border transition-all uppercase tracking-wide
                    ${!answered && 'brutal-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none'}
                    ${showCorrect && 'brutal-beige shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                    ${showWrong && 'bg-[#ffcccc] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                    ${answered && !isSelected && !isCorrect && 'opacity-40 bg-gray-200'}
                    disabled:cursor-default text-foreground
                  `}
                >
                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {showCorrect && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                      </motion.div>
                    )}
                    {showWrong && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <X className="w-5 h-5 stroke-[3]" />
                      </motion.div>
                    )}
                    <span className="text-center leading-tight">{option}</span>
                  </div>
                </motion.div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
