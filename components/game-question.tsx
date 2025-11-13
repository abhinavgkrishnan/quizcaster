/**
 * GameQuestion v2 - Pure Component
 * No internal state except UI, receives all data from parent
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Timer from "./timer"
import { Check, X } from "lucide-react"

interface GameQuestionProps {
  question: {
    id: string
    question: string
    options: string[]
    imageUrl?: string | null
  }
  onAnswer: (answer: string, timeToAnswer: number) => Promise<void> | void
  isDisabled: boolean
  showResult: boolean
  wasCorrect: boolean | null
  timeRemaining: number  // Server-controlled time
}

export default function GameQuestion({
  question,
  onAnswer,
  isDisabled,
  showResult,
  wasCorrect,
  timeRemaining
}: GameQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  // Reset when question changes
  useEffect(() => {
    setShowOptions(false)
    setSelectedAnswer(null)
    startTimeRef.current = Date.now()

    // Show real options after 800ms (just before timer starts at 1s)
    const timer = setTimeout(() => {
      setShowOptions(true)
      startTimeRef.current = Date.now() // Reset timer when options show
    }, 800)

    return () => clearTimeout(timer)
  }, [question.id])

  const handleSelectAnswer = async (option: string) => {
    if (isDisabled || selectedAnswer) return

    const timeToAnswer = Date.now() - startTimeRef.current
    setSelectedAnswer(option)

    // Call parent (parent manages all logic)
    await onAnswer(option, timeToAnswer)
  }

  const handleTimeout = () => {
    if (isDisabled || selectedAnswer) return

    setSelectedAnswer('TIMEOUT') // Visual marker
    onAnswer('TIMEOUT', 10000)
  }

  const hasImage = !!question.imageUrl

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Timer */}
      <div className="flex justify-center pt-1">
        <Timer
          timeRemaining={timeRemaining}
          onTimeout={handleTimeout}
        />
      </div>

      {/* Question Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center px-2"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight text-balance">
          {question.question}
        </h2>
      </motion.div>

      {/* Image if present */}
      {question.imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
        >
          <img
            src={question.imageUrl}
            alt="Question visual"
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Options */}
      <div className={`flex-1 flex flex-col justify-end pb-2 ${hasImage ? 'gap-2' : 'gap-2.5'}`}>
        <div className={hasImage ? 'grid grid-cols-2 grid-rows-2 gap-2.5' : 'flex flex-col gap-2.5'}>
          {!showOptions ? (
            // Skeleton placeholders
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.04
                }}
                className={`relative ${hasImage ? 'h-full min-h-[60px]' : ''} w-full ${hasImage ? 'p-3' : 'p-4'} rounded-2xl brutal-border bg-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse`}
              >
                <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto" />
              </motion.div>
            ))
          ) : (
            // Real options
            question.options.map((option, index) => {
              const isSelected = selectedAnswer === option
              const isTimeoutMarker = selectedAnswer === 'TIMEOUT'

              return (
                <motion.button
                  key={`${question.id}-${option}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.04
                  }}
                  whileHover={!isDisabled && !selectedAnswer ? {
                    y: -2,
                    transition: { type: "spring", stiffness: 500, damping: 15 }
                  } : {}}
                  whileTap={!isDisabled && !selectedAnswer ? {
                    y: 2,
                    transition: { type: "spring", stiffness: 500, damping: 15 }
                  } : {}}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={isDisabled || !!selectedAnswer}
                  className={`relative ${hasImage ? 'h-full' : ''}`}
                >
                  <motion.div
                    className={`
                      relative ${hasImage ? 'h-full min-h-[60px]' : ''} w-full ${hasImage ? 'p-3' : 'p-4'} rounded-2xl font-bold ${hasImage ? 'text-xs' : 'text-sm'} brutal-border transition-shadow uppercase tracking-wide
                      ${!selectedAnswer && !isDisabled && 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none'}
                      ${isSelected && !showResult && 'bg-gray-100 animate-pulse'}
                      ${isSelected && showResult && wasCorrect && 'brutal-violet shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                      ${isSelected && showResult && !wasCorrect && 'brutal-beige shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                      ${!isSelected && selectedAnswer && 'opacity-40 bg-gray-200'}
                      ${isTimeoutMarker && 'opacity-40 bg-gray-200'}
                      disabled:cursor-default text-foreground
                    `}
                  >
                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      {showResult && isSelected && wasCorrect !== null && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        >
                          {wasCorrect ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            <X className="w-5 h-5 stroke-[3]" />
                          )}
                        </motion.div>
                      )}
                      <span className="text-center leading-tight">{option}</span>
                    </div>
                  </motion.div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
