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
    <main className="w-full h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center overflow-hidden">
      {currentScreen === "topics" && <TopicSelection onSelectTopic={handleTopicSelect} />}
      {currentScreen === "matchmaking" && selectedTopic && (
        <Matchmaking topic={selectedTopic} onMatchFound={handleMatchmakingComplete} />
      )}
      {currentScreen === "game" && selectedTopic && <GameScreen topic={selectedTopic} onGameEnd={handleGameEnd} />}
    </main>
  )
}
