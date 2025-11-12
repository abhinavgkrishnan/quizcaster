"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface TimerProps {
  onTimeout: () => void
  duration?: number
}

export default function Timer({ onTimeout, duration = 10 }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 0.1)
    }, 100)

    return () => clearInterval(timer)
  }, [timeLeft, onTimeout])

  const progress = (timeLeft / duration) * 100
  const isLowTime = timeLeft < 3

  return (
    <div className="relative w-32 h-32">
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        {/* Progress circle */}
        <motion.circle
          cx="60"
          cy="60"
          r="56"
          fill="none"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 56}`}
          strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
          stroke="currentColor"
          className={`transition-colors ${isLowTime ? "text-red-500" : "text-primary"}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Timer text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: isLowTime ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isLowTime ? Number.POSITIVE_INFINITY : 0 }}
          className="text-center"
        >
          <div className={`text-3xl font-bold ${isLowTime ? "text-red-500" : "text-primary"}`}>
            {Math.ceil(timeLeft)}
          </div>
          <div className="text-xs text-muted-foreground">seconds</div>
        </motion.div>
      </div>
    </div>
  )
}
