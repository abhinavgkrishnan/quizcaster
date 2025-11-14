"use client"

import { useState, useEffect } from "react"
import TopicSelection from "@/components/topic-selection"
import Matchmaking from "@/components/matchmaking"
import GameScreen from "@/components/game-screen"
import Profile from "@/components/profile"
import Leaderboard from "@/components/leaderboard"
import FriendsList from "@/components/friends-list"
import { useFarcaster } from "@/lib/farcaster-sdk"
import { useAppContext } from "@/lib/contexts/AppContext"
import BottomNav from "@/components/bottom-nav"
import { motion } from "framer-motion"
import { LogIn } from "lucide-react"
import type { AppScreen, MatchData } from "@/lib/types"

export default function Home() {
  const appContext = useAppContext()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [currentMatch, setCurrentMatch] = useState<MatchData | null>(null)
  const { isSDKLoaded, user, isAuthenticated, signIn } = useFarcaster()
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  const { currentScreen, setCurrentScreen, showFriends, setShowFriends, setIsGameScreen } = appContext

  // Check URL params for matchmaking trigger
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const matchmakingTopic = params.get('matchmaking')
      if (matchmakingTopic) {
        setSelectedTopic(matchmakingTopic)
        setCurrentScreen("matchmaking")
        // Clear URL param
        window.history.replaceState({}, '', '/')
      }
    }
  }, [])

  // Update game screen state
  useEffect(() => {
    setIsGameScreen(currentScreen === "game")
  }, [currentScreen, setIsGameScreen])

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic)
    setCurrentScreen("matchmaking")
  }

  const handleMatchmakingComplete = (matchData: MatchData) => {
    setCurrentMatch(matchData)
    setCurrentScreen("game")
  }

  const handleGameEnd = () => {
    setCurrentScreen("topics")
    setSelectedTopic(null)
    setCurrentMatch(null)
  }

  const handlePlayAgain = () => {
    // Keep the same topic and go back to matchmaking
    setCurrentMatch(null)
    setCurrentScreen("matchmaking")
  }

  const handleRematchReady = (newMatchId: string) => {
    // Update match with new matchId - keeps same players and topic
    if (currentMatch && selectedTopic) {
      setCurrentMatch({
        match_id: newMatchId,
        myPlayer: currentMatch.myPlayer,
        opponent: currentMatch.opponent,
      })
      // Stay on game screen - will reconnect with new matchId
    }
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

  // Show sign-in prompt if not authenticated (skip in dev mode)
  if (!isAuthenticated && !isDevMode) {
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
        {currentScreen === "topics" && (
          <TopicSelection
            onSelectTopic={handleTopicSelect}
            onNavigate={setCurrentScreen}
            user={user}
            onFriendsClick={() => setShowFriends(true)}
          />
        )}
        {currentScreen === "matchmaking" && selectedTopic && (
          <div className="flex items-center justify-center h-full bg-card">
            <Matchmaking
              topic={selectedTopic}
              onMatchFound={handleMatchmakingComplete}
              onCancel={() => setCurrentScreen("topics")}
            />
          </div>
        )}
        {currentScreen === "game" && selectedTopic && currentMatch && (
          <GameScreen
            key={currentMatch.match_id}
            topic={selectedTopic}
            matchId={currentMatch.match_id}
            myPlayer={currentMatch.myPlayer}
            opponent={currentMatch.opponent}
            onGameEnd={handleGameEnd}
            onPlayAgain={handlePlayAgain}
            onRematchReady={handleRematchReady}
          />
        )}
        {currentScreen === "profile" && (
          <Profile
            user={user}
            onNavigate={setCurrentScreen}
            onFriendsClick={() => setShowFriends(true)}
          />
        )}
        {currentScreen === "leaderboard" && (
          <Leaderboard
            onNavigate={setCurrentScreen}
            onFriendsClick={() => setShowFriends(true)}
          />
        )}
      </div>

      {/* Global Friends Modal */}
      {showFriends && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <FriendsList
            user={user}
            onClose={() => setShowFriends(false)}
            onChallenge={(friend) => {
              console.log('Challenge friend:', friend)
              setShowFriends(false)
            }}
            onNavigate={(screen) => {
              setShowFriends(false)
              setCurrentScreen(screen)
            }}
            currentScreen={currentScreen}
          />
        </div>
      )}

      {/* Global Bottom Nav */}
      {!appContext.isGameScreen && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
            onFriendsClick={() => setShowFriends(true)}
          />
        </div>
      )}
    </main>
  )
}
