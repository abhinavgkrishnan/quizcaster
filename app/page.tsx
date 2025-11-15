"use client"

import { useState, useEffect } from "react"
import TopicSelection from "@/components/topic-selection"
import Matchmaking from "@/components/matchmaking"
import GameScreen from "@/components/game-screen"
import Profile from "@/components/profile"
import Leaderboard from "@/components/leaderboard"
import FriendsList from "@/components/friends-list"
import Challenges from "@/components/challenges"
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

  const { currentScreen, setCurrentScreen, setIsGameScreen } = appContext

  const [challengeMatchId, setChallengeMatchId] = useState<string | null>(null)
  const [challengeOpponentFid, setChallengeOpponentFid] = useState<string | null>(null)

  // Check URL params for matchmaking trigger and screen navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const matchmakingTopic = params.get('matchmaking')
      const targetScreen = params.get('screen')
      const challengeMatch = params.get('challenge')
      const challengeTopic = params.get('topic')
      const opponentFid = params.get('opponent')

      if (challengeMatch && challengeTopic) {
        // Challenge flow - wait for opponent or go async
        setSelectedTopic(challengeTopic)
        setChallengeMatchId(challengeMatch)
        setChallengeOpponentFid(opponentFid)
        setCurrentScreen("matchmaking")
        window.history.replaceState({}, '', '/')
      } else if (matchmakingTopic) {
        setSelectedTopic(matchmakingTopic)
        setCurrentScreen("matchmaking")
        window.history.replaceState({}, '', '/')
      } else if (targetScreen && ['topics', 'friends', 'leaderboard', 'profile'].includes(targetScreen)) {
        setCurrentScreen(targetScreen as AppScreen)
        window.history.replaceState({}, '', '/')
      }
    }
  }, [])

  // Update game screen state
  useEffect(() => {
    setIsGameScreen(currentScreen === "game" || currentScreen === "matchmaking")
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
          />
        )}
        {currentScreen === "matchmaking" && selectedTopic && (
          <div className="flex items-center justify-center h-full bg-card">
            <Matchmaking
              topic={selectedTopic}
              onMatchFound={handleMatchmakingComplete}
              onCancel={() => setCurrentScreen("topics")}
              challengeMatchId={challengeMatchId}
              challengeOpponentFid={challengeOpponentFid}
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
          />
        )}
        {currentScreen === "leaderboard" && (
          <Leaderboard
            onNavigate={setCurrentScreen}
          />
        )}
        {currentScreen === "friends" && (
          <FriendsList
            user={user}
            onNavigate={setCurrentScreen}
            currentScreen={currentScreen}
          />
        )}
        {currentScreen === "challenges" && (
          <Challenges
            user={user}
            onNavigate={setCurrentScreen}
          />
        )}
      </div>
    </main>
  )
}
