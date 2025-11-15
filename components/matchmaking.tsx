"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { Swords, User, Zap, Clock, X } from "lucide-react"
import { useMatchmaking } from "@/lib/hooks/useMatchmaking"
import { useFarcaster } from "@/lib/farcaster-sdk"
import type { PlayerData, MatchData } from "@/lib/types"
import MatchFound from "./match-found"

interface MatchmakingProps {
  topic: string
  onMatchFound: (matchData: MatchData) => void
  onCancel?: () => void
}

export default function Matchmaking({ topic, onMatchFound, onCancel }: MatchmakingProps) {
  const { user } = useFarcaster()
  const hasJoinedRef = useRef(false)
  const mockFidRef = useRef(999999 + Math.floor(Math.random() * 100)) // Stable random FID per component instance
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const [showMatchFound, setShowMatchFound] = useState(false)
  const [foundMatchData, setFoundMatchData] = useState<any>(null)

  // In dev mode, use mock user with stable random FID for multi-tab testing
  const effectiveUser = user || (isDevMode ? {
    fid: mockFidRef.current,
    username: `DevPlayer${mockFidRef.current}`,
    displayName: `Dev Player ${mockFidRef.current}`,
    pfpUrl: ''
  } : null)

  const handleMatchFound = (payload: any) => {
    // Show match-found screen first
    setFoundMatchData(payload)
    setShowMatchFound(true)
  }

  const { isSearching, queuePosition, queueSize, estimatedWaitTime, joinQueue, leaveQueue } =
    useMatchmaking(
      topic,
      effectiveUser?.fid || 0,
      effectiveUser?.username || 'Player',
      handleMatchFound
    )

  // Join queue on mount ONCE
  useEffect(() => {
    if (hasJoinedRef.current) {
      return
    }

    if (effectiveUser && effectiveUser.fid) {
      hasJoinedRef.current = true
      joinQueue(effectiveUser.displayName, effectiveUser.pfpUrl)
    } else {
      console.error('[Matchmaking Component] No user available!')
    }

    // Leave queue on unmount
    return () => {
      hasJoinedRef.current = false
      leaveQueue()
    }
  }, []) // Empty deps - only run once on mount

  const handleCancel = async () => {
    await leaveQueue()
    onCancel?.()
  }

  // Show "going async" message
  if (goingAsync) {
    return (
      <div className="w-full max-w-md px-6 py-8 flex flex-col items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full brutal-beige brutal-border flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Clock className="w-12 h-12 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3 uppercase tracking-tight">
            Going Async
          </h2>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
            Play now, they'll respond later
          </p>
        </motion.div>
      </div>
    )
  }

  // Show "waiting for opponent" screen
  if (waitingForOpponent) {
    return (
      <div className="w-full max-w-md px-6 py-8 flex flex-col items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Clock className="w-12 h-12 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3 uppercase tracking-tight">
            Waiting for Opponent
          </h2>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-8">
            {topic}
          </p>

          {/* Loading dots */}
          <div className="flex gap-2 justify-center mb-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-4, 4, -4],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  delay: i * 0.15,
                  duration: 0.8,
                  repeat: Infinity
                }}
                className="w-3 h-3 rounded-full bg-foreground"
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            If they don't join, you'll play async
          </p>
        </motion.div>
      </div>
    )
  }

  // Show match-found screen
  if (showMatchFound && foundMatchData) {
    const isPlayer1 = foundMatchData.player1.fid === effectiveUser?.fid
    const myPlayer = isPlayer1 ? foundMatchData.player1 : foundMatchData.player2
    const opponent = isPlayer1 ? foundMatchData.player2 : foundMatchData.player1

    return <MatchFound
      player1={foundMatchData.player1}
      player2={foundMatchData.player2}
      onAnimationComplete={() => {
        onMatchFound({
          match_id: foundMatchData.match_id,
          myPlayer,
          opponent,
        })
      }}
    />
  }

  return (
    <div className="w-full max-w-md px-6 py-8 flex flex-col items-center justify-center min-h-[500px]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-3 uppercase tracking-tight">
          Finding Match
        </h2>
        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">{topic}</p>
      </motion.div>

      <div className="flex flex-col items-center gap-8">
          {/* Simple rotating icon */}
          <div className="relative w-32 h-32">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-full h-full rounded-full brutal-violet brutal-border flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <Swords className="w-16 h-16 text-foreground" />
            </motion.div>
          </div>

          {/* Queue info */}
          {queuePosition !== null && (
            <div className="brutal-white brutal-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 text-foreground">
                <Clock className="w-5 h-5" />
                <div className="text-sm font-semibold">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Position:</span>{' '}
                  <span className="text-base font-bold">{queuePosition}</span>
                  {queueSize !== null && <span className="text-xs text-muted-foreground"> / {queueSize}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Loading dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-4, 4, -4],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  delay: i * 0.15,
                  duration: 0.8,
                  repeat: Infinity
                }}
                className="w-3 h-3 rounded-full bg-foreground"
              />
            ))}
          </div>

          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm text-muted-foreground font-semibold uppercase tracking-wide"
          >
            Searching for opponent...
          </motion.p>

          {/* Cancel Button */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 2 }}
            onClick={handleCancel}
            className="mt-6 px-6 py-3 rounded-2xl brutal-border bg-background font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all text-foreground uppercase tracking-wide flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </motion.button>
        </div>
    </div>
  )
}
