"use client"

import { motion } from "framer-motion"
import { Clock, User } from "lucide-react"

interface AsyncWaitingScreenProps {
  opponentUsername: string
  topic: string
}

export default function AsyncWaitingScreen({ opponentUsername, topic }: AsyncWaitingScreenProps) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-card px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full brutal-violet brutal-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Clock className="w-12 h-12 text-foreground" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
      >
        Waiting for Opponent
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground text-center mb-6 max-w-sm"
      >
        <span className="font-bold text-foreground">@{opponentUsername}</span> needs to finish their match first
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="brutal-beige brutal-border px-6 py-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1">
          Topic
        </p>
        <p className="text-lg font-bold uppercase tracking-wide text-foreground">
          {topic}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex gap-2"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-foreground"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 rounded-full bg-foreground"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          className="w-2 h-2 rounded-full bg-foreground"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-muted-foreground mt-4 text-center"
      >
        You'll be notified when they're ready
      </motion.p>
    </div>
  )
}
