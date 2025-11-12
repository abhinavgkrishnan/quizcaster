"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface TimerProps {
  onTimeout: () => void
  duration?: number
  isPaused?: boolean
}

export default function Timer({ onTimeout, duration = 10, isPaused = false }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (isPaused) return

    if (timeLeft <= 0) {
      onTimeout()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 0.1)
    }, 100)

    return () => clearInterval(timer)
  }, [timeLeft, onTimeout, isPaused])

  const progress = (timeLeft / duration) * 100
  const isLowTime = timeLeft < 3

  // Simple color based on time
  const getColor = () => {
    if (timeLeft > 5) return '#CFB8FF'
    if (timeLeft > 3) return '#FEFFDD'
    return '#ffcccc'
  }

  const color = getColor()

  return (
    <motion.div
      className="relative w-28 h-28"
      animate={isLowTime ? {
        x: [-2, 2, -2, 2, 0],
      } : {}}
      transition={{
        duration: 0.3,
        repeat: isLowTime ? Infinity : 0,
      }}
    >
      {/* Background circle with brutal border */}
      <div className="absolute inset-0 rounded-full brutal-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />

      {/* SVG Circle */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="8"
        />

        {/* Progress circle */}
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 52}`}
          strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
          stroke={color}
          strokeLinecap="butt"
          initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - progress / 100) }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </svg>

      {/* Timer text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-center"
          animate={isLowTime ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{
            duration: 0.5,
            repeat: isLowTime ? Infinity : 0,
          }}
        >
          <div className="text-3xl font-bold text-foreground">
            {Math.ceil(timeLeft)}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            sec
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
