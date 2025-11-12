"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import Timer from "./timer"
import { Check, X } from "lucide-react"

interface GameQuestionProps {
  question: {
    id: string
    question: string
    options: string[]
    image?: string | null
  }
  onAnswer: (answer: string, timeToAnswer: number) => Promise<void> | void
  answered: boolean
}

export default function GameQuestion({ question, onAnswer, answered }: GameQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset and show options with delay
  useEffect(() => {
    setShowOptions(false)
    setStartTime(null)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setIsSubmitting(false)

    const timer = setTimeout(() => {
      setShowOptions(true)
      setStartTime(Date.now())
    }, 500)

    return () => clearTimeout(timer)
  }, [question.id])

  const handleSelectAnswer = async (option: string) => {
    if (answered || !startTime || isSubmitting) return

    const timeToAnswer = Date.now() - startTime

    setSelectedAnswer(option)
    setIsSubmitting(true)

    // Call parent to submit answer (async - calls API)
    await onAnswer(option, timeToAnswer)

    setIsSubmitting(false)
  }

  // Show confetti when correct answer is revealed
  useEffect(() => {
    if (answered && selectedAnswer && isCorrect === null) {
      // Check if we got feedback (parent should have updated via re-render or we infer from score change)
      // For now, we'll add confetti trigger from parent
    }
  }, [answered, selectedAnswer, isCorrect])

  const hasImage = !!question.image

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Timer */}
      <div className="flex justify-center pt-1">
        <Timer
          onTimeout={() => onAnswer("", 10000)}
          isPaused={!showOptions}
        />
      </div>

      {/* Question Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center px-2"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight text-balance">
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
      <div className={`flex-1 flex flex-col justify-end pb-2 ${hasImage ? 'gap-2' : 'gap-2.5'}`}>
        <div className={hasImage ? 'grid grid-cols-2 grid-rows-2 gap-2.5' : 'flex flex-col gap-2.5'}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const showAsAnswered = answered && isSelected

            return (
              <motion.button
                key={`${question.id}-${option}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={showOptions ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: showOptions ? index * 0.04 : 0
                }}
                whileHover={!answered && !isSubmitting ? {
                  y: -2,
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                } : {}}
                whileTap={!answered && !isSubmitting ? {
                  y: 2,
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                } : {}}
                onClick={() => handleSelectAnswer(option)}
                disabled={answered || !showOptions || isSubmitting}
                className={`relative ${hasImage ? 'h-full' : ''}`}
              >
                <motion.div
                  className={`
                    relative ${hasImage ? 'h-full min-h-[60px]' : ''} w-full ${hasImage ? 'p-3' : 'p-4'} rounded-2xl font-bold ${hasImage ? 'text-xs' : 'text-sm'} brutal-border transition-shadow uppercase tracking-wide
                    ${!answered && !isSubmitting && 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none'}
                    ${answered && isSelected && 'bg-[#FEFFDD] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                    ${answered && !isSelected && 'opacity-40 bg-gray-200'}
                    ${isSubmitting && isSelected && 'bg-gray-100 animate-pulse'}
                    disabled:cursor-default text-foreground
                  `}
                >
                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {answered && isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
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
