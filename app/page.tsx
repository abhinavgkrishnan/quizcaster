"use client"

import { useState } from "react"
import TopicSelection from "@/components/topic-selection"
import Matchmaking from "@/components/matchmaking"
import GameScreen from "@/components/game-screen"
import { useFarcaster } from "@/lib/farcaster-sdk"
import { motion } from "framer-motion"
import { LogIn } from "lucide-react"

type AppScreen = "topics" | "matchmaking" | "game"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("topics")
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const { isSDKLoaded, user, isAuthenticated, signIn } = useFarcaster()

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic)
    setCurrentScreen("matchmaking")
  }

  const handleMatchmakingComplete = () => {
    setCurrentScreen("game")
  }

  const handleGameEnd = () => {
    setCurrentScreen("topics")
    setSelectedTopic(null)
  }

  // Show loading state while SDK initializes
  if (!isSDKLoaded) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-muted flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-3 h-3 rounded-full bg-foreground" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Loading...</p>
        </div>
      </main>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-muted flex items-center justify-center">
        <div className="w-full max-w-md px-6 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">QuizCaster</h1>
          <p className="text-muted-foreground text-sm mb-8 font-semibold uppercase tracking-wide">
            Sign in to play
          </p>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 2 }}
            onClick={signIn}
            className="w-full py-5 rounded-2xl brutal-violet brutal-border font-bold text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all text-foreground uppercase tracking-wide"
          >
            <span className="flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              Sign In with Farcaster
            </span>
          </motion.button>
        </div>
      </main>
    )
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-muted">
      {/* Content */}
      <div className="relative z-10 h-full">
        {currentScreen === "topics" && <TopicSelection onSelectTopic={handleTopicSelect} />}
        {currentScreen === "matchmaking" && selectedTopic && (
          <div className="flex items-center justify-center h-full bg-card">
            <Matchmaking topic={selectedTopic} onMatchFound={handleMatchmakingComplete} />
          </div>
        )}
        {currentScreen === "game" && selectedTopic && <GameScreen topic={selectedTopic} onGameEnd={handleGameEnd} user={user} />}
      </div>
    </main>
  )
}
