"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Swords, User, Zap } from "lucide-react"

interface MatchmakingProps {
  topic: string
  onMatchFound: () => void
}

export default function Matchmaking({ topic, onMatchFound }: MatchmakingProps) {
  const [matchFound, setMatchFound] = useState(false)
  const [opponent, setOpponent] = useState<string>("")

  useEffect(() => {
    // Simulate matchmaking search
    const searchTimer = setTimeout(() => {
      const opponents = ["Alex", "Jordan", "Casey", "Morgan", "Riley", "Taylor"]
      setOpponent(opponents[Math.floor(Math.random() * opponents.length)])
      setMatchFound(true)
    }, 2000)

    return () => clearTimeout(searchTimer)
  }, [])

  useEffect(() => {
    if (matchFound) {
      const startTimer = setTimeout(onMatchFound, 1500)
      return () => clearTimeout(startTimer)
    }
  }, [matchFound, onMatchFound])

  return (
    <div className="w-full max-w-md px-6 py-8 flex flex-col items-center justify-center min-h-[500px]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl font-bold text-foreground mb-3 uppercase tracking-tight">
          {matchFound ? "Match Found!" : "Finding Match"}
        </h2>
        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">{topic}</p>
      </motion.div>

      {!matchFound ? (
        <div className="flex flex-col items-center gap-12">
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
            Searching...
          </motion.p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-center w-full"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="mb-8 flex justify-center"
          >
            <div className="w-28 h-28 rounded-full brutal-beige brutal-border flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-14 h-14 text-foreground" />
            </div>
          </motion.div>

          <motion.h3
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-foreground mb-2 uppercase"
          >
            Opponent Found!
          </motion.h3>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm mb-8 uppercase tracking-wide font-semibold"
          >
            Prepare for battle
          </motion.p>

          {/* Opponent card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="brutal-white brutal-border rounded-2xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full brutal-violet brutal-border-thin flex items-center justify-center">
                <User className="w-7 h-7 text-foreground" />
              </div>
              <Swords className="w-6 h-6 text-foreground" />
              <div className="w-14 h-14 rounded-full brutal-beige brutal-border-thin flex items-center justify-center">
                <User className="w-7 h-7 text-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground uppercase tracking-tight">
              {opponent}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-muted-foreground font-semibold uppercase tracking-wider"
          >
            Starting game...
          </motion.p>
        </motion.div>
      )}
    </div>
  )
}
