"use client"

import { useState } from "react"
import TopicSelection from "@/components/topic-selection"
import Matchmaking from "@/components/matchmaking"
import GameScreen from "@/components/game-screen"

type AppScreen = "topics" | "matchmaking" | "game"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("topics")
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

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
        {currentScreen === "game" && selectedTopic && <GameScreen topic={selectedTopic} onGameEnd={handleGameEnd} />}
      </div>
    </main>
  )
}
