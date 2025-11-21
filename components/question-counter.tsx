"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap } from "lucide-react"
import { useSounds } from "@/lib/hooks/useSounds"

interface QuestionCounterProps {
  questionNumber: number
  totalQuestions: number
  isFinalQuestion?: boolean
}

export default function QuestionCounter({
  questionNumber,
  totalQuestions,
  isFinalQuestion = false
}: QuestionCounterProps) {
  const { play2X } = useSounds()

  // Play 2X sound when final question appears
  useEffect(() => {
    if (isFinalQuestion) {
      play2X()
    }
  }, [isFinalQuestion, play2X])
  return (
    <div className="relative z-10 text-center mb-1.5 flex-shrink-0">
      <div className="flex items-center justify-center gap-2">
        <motion.div
          key={questionNumber}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block brutal-white brutal-border px-4 py-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
            Question {questionNumber} of {totalQuestions}
          </p>
        </motion.div>

        {/* 2X Badge for Final Question */}
        <AnimatePresence>
          {isFinalQuestion && (
            <motion.div
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.6
              }}
              className="inline-block brutal-violet brutal-border px-3 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-foreground fill-foreground" />
                <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                  2X POINTS
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
