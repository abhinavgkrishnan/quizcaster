"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

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
    <div className="w-full max-w-md px-4 py-8 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-12">
        <h2 className="text-2xl font-bold text-primary mb-2">Finding Match</h2>
        <p className="text-muted-foreground">{topic}</p>
      </motion.div>

      {!matchFound ? (
        <div className="flex flex-col items-center gap-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full border-4 border-primary-foreground opacity-30" />
          </motion.div>

          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ delay: i * 0.2, duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>

          <p className="text-sm text-muted-foreground">Searching for a worthy opponent...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full"
        >
          <div className="mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-primary mb-2">Match Found!</h3>
            <p className="text-muted-foreground">Playing against</p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border mb-6">
            <p className="text-2xl font-bold text-foreground">{opponent}</p>
          </div>

          <p className="text-sm text-muted-foreground">Starting game in a moment...</p>
        </motion.div>
      )}
    </div>
  )
}
