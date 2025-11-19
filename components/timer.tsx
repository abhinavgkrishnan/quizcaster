"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { GAME_CONFIG } from "@/lib/constants"

interface TimerProps {
  timeRemaining: number  // Server-controlled time
  onTimeout?: () => void
  duration?: number
  questionId?: string  // Track question changes to stop audio
}

export default function Timer({ timeRemaining, onTimeout, duration = GAME_CONFIG.QUESTION_TIME_LIMIT, questionId }: TimerProps) {
  const hasPlayedTick = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element once with loop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/Manikkutty.mp3')
      audioRef.current.volume = 0.5
      audioRef.current.loop = true
    }

    // CLEANUP: Stop audio when component unmounts (game ends, navigation, etc.)
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }
  }, [])

  // Stop audio when question changes (new question starts)
  useEffect(() => {
    // Stop and reset when question changes
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      hasPlayedTick.current = false
    }
  }, [questionId])

  // Play/stop tick sound based on time remaining
  useEffect(() => {
    if (!audioRef.current) return

    // Start playing when timer hits 5 seconds
    if (timeRemaining <= 5 && timeRemaining > 0 && !hasPlayedTick.current) {
      try {
        audioRef.current.play().catch(() => {
          // Silently ignore if sound doesn't play
        })
        hasPlayedTick.current = true
      } catch (e) {
        // Ignore sound errors
      }
    }

    // Stop playing when timer reaches 0
    if (timeRemaining <= 0) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      hasPlayedTick.current = false
    }
  }, [timeRemaining])

  // Call onTimeout when time reaches 0
  useEffect(() => {
    if (timeRemaining <= 0 && onTimeout) {
      onTimeout()
    }
  }, [timeRemaining, onTimeout])

  const progress = (timeRemaining / duration) * 100
  const isLowTime = timeRemaining < 3

  // Simple color based on time
  const getColor = () => {
    if (timeRemaining > 5) return '#CFB8FF'
    if (timeRemaining > 3) return '#FEFFDD'
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
            {Math.ceil(timeRemaining)}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            sec
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
