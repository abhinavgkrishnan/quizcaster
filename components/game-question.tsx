/**
 * GameQuestion v2 - Pure Component
 * No internal state except UI, receives all data from parent
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Timer from "./timer"
import { Check, X } from "lucide-react"
import { GAME_CONFIG } from "@/lib/constants"
import { useSounds } from "@/lib/hooks/useSounds"

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
  correctAnswer?: string | null  // The correct answer to highlight
  timeRemaining: number  // Server-controlled time
}

export default function GameQuestion({
  question,
  onAnswer,
  isDisabled,
  showResult,
  wasCorrect,
  correctAnswer,
  timeRemaining
}: GameQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const { playCorrect, playWrong } = useSounds()
  const playCorrectRef = useRef(playCorrect)
  const playWrongRef = useRef(playWrong)

  // Keep refs up to date
  useEffect(() => {
    playCorrectRef.current = playCorrect
    playWrongRef.current = playWrong
  }, [playCorrect, playWrong])

  // Reset when question changes
  useEffect(() => {
    setShowOptions(false)
    setSelectedAnswer(null)
    startTimeRef.current = Date.now()

    // Show real options after configured delay
    const timer = setTimeout(() => {
      setShowOptions(true)
      startTimeRef.current = Date.now() // Reset timer when options show
    }, GAME_CONFIG.OPTIONS_LOAD_DELAY)

    return () => clearTimeout(timer)
  }, [question.id])

  // Play sound when result is shown
  useEffect(() => {
    if (showResult && wasCorrect !== null) {
      if (wasCorrect) {
        playCorrectRef.current()
      } else {
        playWrongRef.current()
      }
    }
  }, [showResult, wasCorrect])

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
    <div className="flex flex-col h-full overflow-visible" style={{ gap: '1rem' }}>
      {/* Timer */}
      <div className="flex justify-center overflow-visible flex-shrink-0">
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
        className="text-center flex-shrink-0"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight text-balance">
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
      <div className="flex-1 flex flex-col justify-end overflow-visible min-h-0">
        <AnimatePresence mode="wait">
          {!showOptions ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`${hasImage ? 'grid grid-cols-2 grid-rows-2 gap-2.5' : 'flex flex-col gap-2.5'} overflow-visible p-2`}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className={`relative ${hasImage ? 'h-full min-h-[60px]' : 'h-[60px]'} w-full ${hasImage ? 'p-3' : 'p-4'} rounded-2xl brutal-border bg-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
                  style={{ transform: 'translate3d(0, 0, 0)' }}
                >
                  <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto animate-pulse" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`${hasImage ? 'grid grid-cols-2 grid-rows-2 gap-2.5' : 'flex flex-col gap-2.5'} overflow-visible p-2`}
            >
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isTimeoutMarker = selectedAnswer === 'TIMEOUT'
                const isCorrectAnswer = showResult && correctAnswer === option
                const shouldFlash = showResult && wasCorrect === false && isCorrectAnswer

                return (
                  <button
                    key={`${question.id}-${option}-${index}`}
                    style={{
                      transform: 'translate3d(0, 0, 0)',
                      WebkitTransform: 'translate3d(0, 0, 0)',
                      animation: shouldFlash ? 'flashCorrect 0.8s ease-in-out 2' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !selectedAnswer) {
                        e.currentTarget.style.transform = 'translate3d(0, -4px, 0)';
                        e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
                    }}
                    onTouchStart={(e) => {
                      if (!isDisabled && !selectedAnswer) {
                        e.currentTarget.style.transform = 'translate3d(0, -2px, 0)';
                        e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
                    }}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={isDisabled || !!selectedAnswer}
                    className={`
                      relative ${hasImage ? 'h-full min-h-[60px]' : 'h-[60px]'} w-full ${hasImage ? 'p-3' : 'p-4'} rounded-2xl font-bold ${hasImage ? 'text-xs' : 'text-sm'} brutal-border transition-all duration-200 uppercase tracking-wide
                      ${!selectedAnswer && !isDisabled && 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                      ${isSelected && !showResult && 'bg-gray-100 animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                      ${isSelected && showResult && wasCorrect && 'brutal-violet shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                      ${isSelected && showResult && !wasCorrect && 'brutal-beige shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                      ${isCorrectAnswer && !isSelected && showResult && 'brutal-violet shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                      ${!isSelected && !isCorrectAnswer && selectedAnswer && 'opacity-40 bg-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                      ${isTimeoutMarker && 'opacity-40 bg-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                      disabled:cursor-default text-foreground
                    `}
                  >
                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      {showResult && isSelected && wasCorrect !== null && (
                        <>
                          {wasCorrect ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            <X className="w-5 h-5 stroke-[3]" />
                          )}
                        </>
                      )}
                      <span className="text-center leading-tight">{option}</span>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
