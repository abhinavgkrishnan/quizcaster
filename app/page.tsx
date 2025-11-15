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
import { LogIn, Clock } from "lucide-react"
import type { AppScreen, MatchData } from "@/lib/types"

export default function Home() {
  const appContext = useAppContext()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [currentMatch, setCurrentMatch] = useState<MatchData | null>(null)
  const { isSDKLoaded, user, isAuthenticated, signIn } = useFarcaster()
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  const { currentScreen, setCurrentScreen, setIsGameScreen } = appContext
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingType, setWaitingType] = useState<'join' | 'playing'>('join')
  const [goingAsync, setGoingAsync] = useState(false)

  // Check URL params for matchmaking trigger and screen navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const matchmakingTopic = params.get('matchmaking')
      const targetScreen = params.get('screen')
      const challengeMatchId = params.get('challenge')
      const challengeTopic = params.get('topic')
      const matchId = params.get('match')

      if (challengeMatchId && challengeTopic) {
        // Challenge sent - show waiting screen, poll for opponent join
        setSelectedTopic(challengeTopic)
        setWaitingForOpponent(true)
        setWaitingType('join')

        let pollInterval: NodeJS.Timeout
        let hasJoined = false
        const startTime = Date.now()

        // Poll every 2 seconds to check if opponent joined
        pollInterval = setInterval(async () => {
          const response = await fetch(`/api/matches/${challengeMatchId}`)
          const matchData = await response.json()

          // Check if opponent joined (status changed from 'waiting')
          if (matchData.status !== 'waiting' && matchData.status !== 'declined') {
            hasJoined = true
            clearInterval(pollInterval)
            setWaitingForOpponent(false)

            // Opponent joined! Start live match via matchmaking
            const isPlayer1 = matchData.player1_fid === user?.fid
            setCurrentMatch({
              match_id: challengeMatchId,
              myPlayer: {
                fid: user?.fid || 0,
                username: user?.username || '',
                displayName: user?.displayName || '',
                pfpUrl: user?.pfpUrl || ''
              },
              opponent: {
                fid: isPlayer1 ? matchData.player2_fid : matchData.player1_fid,
                username: 'Opponent',
                displayName: 'Opponent',
                pfpUrl: ''
              }
            })
            setCurrentScreen("game")
          }
        }, 2000)

        // After 30 seconds, if opponent hasn't joined, go async
        setTimeout(() => {
          clearInterval(pollInterval)

          if (!hasJoined) {
            setWaitingForOpponent(false)
            setGoingAsync(true)

            // Brief "going async" message, then start async game
            setTimeout(async () => {
              const response = await fetch(`/api/matches/${challengeMatchId}`)
              const matchData = await response.json()

              if (matchData && user) {
                const isPlayer1 = matchData.player1_fid === user.fid
                setCurrentMatch({
                  match_id: challengeMatchId,
                  myPlayer: {
                    fid: user.fid,
                    username: user.username,
                    displayName: user.displayName,
                    pfpUrl: user.pfpUrl
                  },
                  opponent: {
                    fid: isPlayer1 ? matchData.player2_fid : matchData.player1_fid,
                    username: 'Opponent',
                    displayName: 'Opponent',
                    pfpUrl: ''
                  }
                })
                setCurrentScreen("game")
                setGoingAsync(false)
              }
            }, 2000)
          }
        }, 30000)

        window.history.replaceState({}, '', '/')
      } else if (matchId) {
        // Direct match link (from accepting challenge)
        fetchMatchAndStart(matchId)
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
  }, [user])

  const fetchMatchAndStart = async (matchId: string) => {
    const response = await fetch(`/api/matches/${matchId}`)
    const matchData = await response.json()

    if (matchData && user) {
      const isPlayer1 = matchData.player1_fid === user.fid
      setSelectedTopic(matchData.topic)

      // Check if challenger is still playing (opponent accepts while challenger is mid-game)
      if (matchData.player1_completed_at && !matchData.player2_completed_at && !isPlayer1) {
        // Challenger finished, opponent can play async with replay
        setCurrentMatch({
          match_id: matchId,
          myPlayer: {
            fid: user.fid,
            username: user.username,
            displayName: user.displayName,
            pfpUrl: user.pfpUrl
          },
          opponent: {
            fid: matchData.player1_fid,
            username: 'Challenger',
            displayName: 'Challenger',
            pfpUrl: ''
          }
        })
        setCurrentScreen("game")
      } else if (!matchData.player1_completed_at && !isPlayer1) {
        // Challenger still playing - show "in progress" screen and poll
        setWaitingForOpponent(true)
        setWaitingType('playing')

        const pollForCompletion = setInterval(async () => {
          const res = await fetch(`/api/matches/${matchId}`)
          const data = await res.json()

          if (data.player1_completed_at) {
            clearInterval(pollForCompletion)
            setWaitingForOpponent(false)
            // Challenger finished, now opponent can play
            setCurrentMatch({
              match_id: matchId,
              myPlayer: {
                fid: user.fid,
                username: user.username,
                displayName: user.displayName,
                pfpUrl: user.pfpUrl
              },
              opponent: {
                fid: data.player1_fid,
                username: 'Challenger',
                displayName: 'Challenger',
                pfpUrl: ''
              }
            })
            setCurrentScreen("game")
          }
        }, 3000)
      } else {
        // Normal match start
        setCurrentMatch({
          match_id: matchId,
          myPlayer: {
            fid: user.fid,
            username: user.username,
            displayName: user.displayName,
            pfpUrl: user.pfpUrl
          },
          opponent: {
            fid: isPlayer1 ? matchData.player2_fid : matchData.player1_fid,
            username: 'Opponent',
            displayName: 'Opponent',
            pfpUrl: ''
          }
        })
        setCurrentScreen("game")
      }
    }
  }

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

  // Show waiting for opponent screen
  if (waitingForOpponent && selectedTopic) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-card flex items-center justify-center">
        <div className="w-full max-w-md px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-24 h-24 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="w-12 h-12 text-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3 uppercase tracking-tight">
              {waitingType === 'join' ? 'Waiting for Opponent' : 'Challenge in Progress'}
            </h2>
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-8">
              {selectedTopic}
            </p>

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
              {waitingType === 'join'
                ? "If they don't join, you'll play async"
                : "Waiting for them to finish their match..."}
            </p>
          </motion.div>
        </div>
      </main>
    )
  }

  // Show "going async" message
  if (goingAsync && selectedTopic) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-card flex items-center justify-center">
        <div className="w-full max-w-md px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
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
