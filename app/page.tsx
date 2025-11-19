"use client"

import { useState, useEffect, useRef } from "react"
import TopicSelection from "@/components/topic-selection"
import Matchmaking from "@/components/matchmaking"
import MatchFound from "@/components/match-found"
import GameScreen from "@/components/game-screen"
import AsyncSoloGame from "@/components/async-solo-game"
import AsyncEmulationGame from "@/components/async-emulation-game"
import ChallengeSentScreen from "@/components/challenge-sent-screen"
import Profile from "@/components/profile"
import Leaderboard from "@/components/leaderboard"
import FriendsList from "@/components/friends-list"
import Challenges from "@/components/challenges"
import { useUnifiedAuth } from "@/lib/contexts/UnifiedAuthContext"
import { useAppContext } from "@/lib/contexts/AppContext"
import BottomNav from "@/components/bottom-nav"
import { motion } from "framer-motion"
import { LogIn, Clock, X as XIcon, Globe } from "lucide-react"
import type { AppScreen, MatchData } from "@/lib/types"
import { TEXT } from "@/lib/constants"

// Shuffle array helper
const shuffleArray = <T,>(array: readonly T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function Home() {
  const appContext = useAppContext()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedTopicDisplayName, setSelectedTopicDisplayName] = useState<string | null>(null)
  const [currentMatch, setCurrentMatch] = useState<MatchData | null>(null)
  const { isSDKLoaded, user, isAuthenticated, signIn, platform } = useUnifiedAuth()
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  const { currentScreen, setCurrentScreen, setIsGameScreen } = appContext
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingType, setWaitingType] = useState<'join' | 'playing'>('join')
  const [goingAsync, setGoingAsync] = useState(false)
  const [asyncCountdown, setAsyncCountdown] = useState(30)
  const [isAsyncChallenge, setIsAsyncChallenge] = useState(false)
  const [asyncQuestions, setAsyncQuestions] = useState<any[]>([])
  const [isEmulationMode, setIsEmulationMode] = useState(false)
  const [challengerAnswers, setChallengerAnswers] = useState<any[]>([])
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [shuffledTips] = useState(() => shuffleArray(TEXT.MATCHMAKING.PRO_TIPS))
  const [pendingChallengeMatchId, setPendingChallengeMatchId] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const asyncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showChallengeSent, setShowChallengeSent] = useState(false)
  const [challengeSentData, setChallengeSentData] = useState<any>(null)

  // Cycle through pro tips every 5 seconds when waiting for opponent
  useEffect(() => {
    if (!waitingForOpponent) return

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % shuffledTips.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [waitingForOpponent, shuffledTips.length])

  // Countdown timer for "Go Async" button (30 → 0)
  useEffect(() => {
    if (!waitingForOpponent || waitingType !== 'join') {
      setAsyncCountdown(30) // Reset when not waiting
      return
    }

    // Start countdown
    setAsyncCountdown(30)
    const countdownInterval = setInterval(() => {
      setAsyncCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [waitingForOpponent, waitingType])

  // Hide nav bar when waiting for opponent or going async
  useEffect(() => {
    if (waitingForOpponent || goingAsync) {
      setIsGameScreen(true)
    } else if (currentScreen !== 'game') {
      setIsGameScreen(false)
    }
  }, [waitingForOpponent, goingAsync, currentScreen])

  // Function to trigger async mode (called by timeout OR "Go Async" button)
  const triggerAsyncMode = async () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (asyncTimeoutRef.current) clearTimeout(asyncTimeoutRef.current)

    setWaitingForOpponent(false)
    setGoingAsync(true)

    // Brief "going async" message, then start async game
    setTimeout(async () => {
      const challengeMatchId = pendingChallengeMatchId
      if (!challengeMatchId || !user) return

      // Fetch match data with questions
      const response = await fetch(`/api/matches/${challengeMatchId}`)
      const matchData = await response.json()

      if (matchData && matchData.questions) {
        const isPlayer1 = matchData.player1_fid === user.fid
        const opponentFid = isPlayer1 ? matchData.player2_fid : matchData.player1_fid

        // Fetch opponent data and flair
        const [opponentRes, opponentFlairRes] = await Promise.all([
          fetch(`/api/users/${opponentFid}`),
          fetch(`/api/flairs?fid=${opponentFid}`)
        ])
        const opponentData = await opponentRes.json()
        const opponentFlairData = await opponentFlairRes.json()

        // Fetch my flair
        const myFlairRes = await fetch(`/api/flairs?fid=${user.fid}`)
        const myFlairData = await myFlairRes.json()

        // Set async challenge mode
        setIsAsyncChallenge(true)
        setAsyncQuestions(matchData.questions)

        setCurrentMatch({
          match_id: challengeMatchId,
          myPlayer: {
            fid: user.fid,
            username: user.username,
            displayName: user.displayName,
            pfpUrl: user.pfpUrl || '',
            activeFlair: myFlairData.active_flair
          },
          opponent: {
            fid: opponentData.fid,
            username: opponentData.username,
            displayName: opponentData.display_name,
            pfpUrl: opponentData.pfp_url,
            activeFlair: opponentFlairData.active_flair
          }
        })

        // Show VS screen first, clear goingAsync before transition
        sessionStorage.setItem('isChallenge', 'true')
        setGoingAsync(false)
        setCurrentScreen("matchFound")

        setTimeout(() => {
          setCurrentScreen("game")
          sessionStorage.removeItem('isChallenge')
        }, 3000)
      }
    }, 2000)
  }

  const handleChallengeNotification = async (challengeId: string) => {
    try {
      // Fetch challenge details
      const response = await fetch(`/api/challenges?fid=${user?.fid}&type=received`)
      const data = await response.json()
      const challenge = data.challenges?.find((c: any) => c.id === challengeId)

      if (!challenge) {
        // Challenge not found or already completed - go to challenges screen
        console.log('[Challenge Notif] Challenge not found or completed, going to challenges screen')
        setCurrentScreen('challenges')
        return
      }

      console.log('[Challenge Notif] Challenge found, status:', challenge.status)

      if (challenge.status === 'pending') {
        // Auto-accept the challenge when they click notification
        console.log('[Challenge Notif] Auto-accepting challenge')
        const acceptResponse = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'accept',
            challenge_id: challengeId
          })
        })

        if (acceptResponse.ok) {
          const acceptData = await acceptResponse.json()
          console.log('[Challenge Notif] Challenge accepted:', acceptData)
          // Navigate to match which will handle live vs async logic
          window.location.href = `/?match=${challenge.match_id}`
        } else {
          console.error('[Challenge Notif] Failed to accept')
          setCurrentScreen('challenges')
        }
      } else if (challenge.status === 'accepted') {
        // Already accepted, navigate to match
        window.location.href = `/?match=${challenge.match_id}`
      } else {
        // Declined/cancelled/completed - go to challenges screen
        setCurrentScreen('challenges')
      }
    } catch (error) {
      console.error('[Challenge Notif] Error handling notification:', error)
      setCurrentScreen('challenges')
    }
  }

  // Check URL params for matchmaking trigger and screen navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const params = new URLSearchParams(window.location.search)
      const matchmakingTopic = params.get('matchmaking')
      const targetScreen = params.get('screen')
      const challengeMatchId = params.get('challenge')
      const challengeTopic = params.get('topic')
      const matchId = params.get('match')
      const mode = params.get('mode')
      const challengeNotifId = params.get('challenge_notif')
      const viewChallengeMatchId = params.get('view_challenge')

      if (viewChallengeMatchId) {
        // View challenge sent screen - fetch player's answers from DB
        const fetchChallengeData = async () => {
          try {
            // Fetch match and answers from Supabase
            const [matchRes, answersRes, topicsRes] = await Promise.all([
              fetch(`/api/matches/${viewChallengeMatchId}`),
              fetch(`/api/matches/${viewChallengeMatchId}/answers?fid=${user.fid}`),
              fetch('/api/topics')
            ])

            const matchData = await matchRes.json()
            const answersData = await answersRes.json()
            const topicsData = await topicsRes.json()

            if (matchData && answersData.answers) {
              // Get opponent info
              const isPlayer1 = matchData.player1_fid === user.fid
              const opponentName = isPlayer1
                ? (matchData.player2_display_name || matchData.player2_username || 'Opponent')
                : (matchData.player1_display_name || matchData.player1_username || 'Opponent')

              // Get topic display name
              const topic = topicsData.topics?.find((t: any) => t.slug === matchData.topic)
              const topicDisplayName = topic?.display_name || matchData.topic

              // Calculate score and format answers
              const formattedAnswers = answersData.answers.map((a: any) => ({
                isCorrect: a.is_correct,
                timeTaken: a.time_taken_ms,
                points: a.points_earned
              }))
              const score = answersData.answers.reduce((sum: number, a: any) => sum + a.points_earned, 0)

              setChallengeSentData({
                playerScore: score,
                playerAnswers: formattedAnswers,
                opponentName: opponentName,
                topic: topicDisplayName
              })
              setShowChallengeSent(true)
              setCurrentScreen('challenges')
            }
          } catch (error) {
            console.error('Failed to fetch challenge data:', error)
          }
        }
        fetchChallengeData()
        window.history.replaceState({}, '', '/')
      } else if (challengeNotifId) {
        // Handle challenge notification click - smart routing based on challenge status
        handleChallengeNotification(challengeNotifId)
        window.history.replaceState({}, '', '/')
      } else if (challengeMatchId && challengeTopic && user) {
        // If mode=emulation, opponent is accepting challenge
        if (mode === 'emulation') {
          console.log('[Page] Mode=emulation detected, fetching match:', challengeMatchId)
          fetchMatchAndStart(challengeMatchId)
          window.history.replaceState({}, '', '/')
          return
        }

        console.log('[Page] Challenge flow - waiting for opponent:', challengeMatchId)

        // Challenge sent - show waiting screen, poll for opponent join
        setSelectedTopic(challengeTopic)
        // Fetch topic display name
        const fetchTopicName = async () => {
          try {
            const response = await fetch('/api/topics')
            const data = await response.json()
            const foundTopic = data.topics.find((t: any) => t.slug === challengeTopic)
            if (foundTopic) {
              setSelectedTopicDisplayName(foundTopic.display_name)
            }
          } catch (error) {
            console.error('Failed to fetch topic name:', error)
          }
        }
        fetchTopicName()
        setPendingChallengeMatchId(challengeMatchId)
        setWaitingForOpponent(true)
        setWaitingType('join')

        const currentUser = user // Capture user in closure
        let hasJoined = false

        // Poll every 2 seconds to check if opponent joined
        pollIntervalRef.current = setInterval(async () => {
          const response = await fetch(`/api/matches/${challengeMatchId}`)
          const matchData = await response.json()

          // Check if opponent joined (status changed to 'active' and is_async is false = live game)
          if (matchData.status === 'active' && matchData.is_async === false) {
            hasJoined = true
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            setWaitingForOpponent(false)

            console.log('[Page] Opponent accepted within 30s! Starting LIVE game')

            // Opponent joined! Fetch their data
            const isPlayer1 = matchData.player1_fid === currentUser.fid
            const opponentFid = isPlayer1 ? matchData.player2_fid : matchData.player1_fid

            const [opponentRes, myFlairRes, opponentFlairRes] = await Promise.all([
              fetch(`/api/users/${opponentFid}`),
              fetch(`/api/flairs?fid=${currentUser.fid}`),
              fetch(`/api/flairs?fid=${opponentFid}`)
            ])
            const opponentData = await opponentRes.json()
            const myFlairData = await myFlairRes.json()
            const opponentFlairData = await opponentFlairRes.json()

            setIsAsyncChallenge(false) // This is now a live game
            setCurrentMatch({
              match_id: challengeMatchId,
              myPlayer: {
                fid: currentUser.fid,
                username: currentUser.username,
                displayName: currentUser.displayName,
                pfpUrl: currentUser.pfpUrl || '',
                activeFlair: myFlairData.active_flair
              },
              opponent: {
                fid: opponentData.fid,
                username: opponentData.username,
                displayName: opponentData.display_name,
                pfpUrl: opponentData.pfp_url,
                activeFlair: opponentFlairData.active_flair
              }
            })

            sessionStorage.setItem('isChallenge', 'true')
            setCurrentScreen("matchFound")

            setTimeout(() => {
              setCurrentScreen("game")
              sessionStorage.removeItem('isChallenge')
            }, 3000)
          }
        }, 2000)

        // After 30 seconds, if opponent hasn't joined, go async
        asyncTimeoutRef.current = setTimeout(() => {
          if (!hasJoined) {
            triggerAsyncMode()
          }
        }, 30000)

        window.history.replaceState({}, '', '/')
      } else if (matchId) {
        // Direct match link (from accepting challenge)
        fetchMatchAndStart(matchId).then(() => {
          // Clear URL only after match is loaded
          window.history.replaceState({}, '', '/')
        })
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
    console.log('[fetchMatchAndStart] Fetching match:', matchId)
    const response = await fetch(`/api/matches/${matchId}`)
    const matchData = await response.json()
    console.log('[fetchMatchAndStart] Match data:', matchData)
    console.log('[fetchMatchAndStart] User FID:', user?.fid)

    if (matchData && user) {
      const isPlayer1 = matchData.player1_fid === user.fid
      console.log('[fetchMatchAndStart] isPlayer1:', isPlayer1)
      console.log('[fetchMatchAndStart] from_redis:', matchData.from_redis)
      console.log('[fetchMatchAndStart] status:', matchData.status)
      console.log('[fetchMatchAndStart] player1_completed_at:', matchData.player1_completed_at)

      setSelectedTopic(matchData.topic || 'unknown')

      // LIVE MATCH: If is_async=false and match is active, it's a live Socket.IO game
      if (matchData.is_async === false && matchData.status === 'active') {
        console.log('[fetchMatchAndStart] LIVE MATCH: Starting Socket.IO game')

        // Fetch opponent data and flairs
        const opponentFid = isPlayer1 ? matchData.player2_fid : matchData.player1_fid
        const [opponentRes, myFlairRes, opponentFlairRes] = await Promise.all([
          fetch(`/api/users/${opponentFid}`),
          fetch(`/api/flairs?fid=${user.fid}`),
          fetch(`/api/flairs?fid=${opponentFid}`)
        ])
        const opponentData = await opponentRes.json()
        const myFlairData = await myFlairRes.json()
        const opponentFlairData = await opponentFlairRes.json()

        setCurrentMatch({
          match_id: matchId,
          myPlayer: {
            fid: user.fid,
            username: user.username,
            displayName: user.displayName,
            pfpUrl: user.pfpUrl,
            activeFlair: myFlairData.active_flair
          },
          opponent: {
            fid: opponentData.fid,
            username: opponentData.username,
            displayName: opponentData.display_name,
            pfpUrl: opponentData.pfp_url,
            activeFlair: opponentFlairData.active_flair
          }
        })
        // Store if this is a challenge match for MatchFound component
        sessionStorage.setItem('isChallenge', matchData.match_type === 'async_challenge' ? 'true' : 'false')
        setCurrentScreen("matchFound")

        // Show VS screen for 3 seconds then start game
        setTimeout(() => {
          setCurrentScreen("game")
          sessionStorage.removeItem('isChallenge')
        }, 3000)
        return
      }

      // SCENARIO 3: Challenger finished (opponent accepts after challenger done)
      if (matchData.player1_completed_at && !matchData.player2_completed_at && !isPlayer1) {
        console.log('[fetchMatchAndStart] SCENARIO 3: Challenger finished! Starting emulation mode')

        // Fetch emulation data and flairs
        const [emulationRes, myFlairRes, challengerFlairRes] = await Promise.all([
          fetch(`/api/matches/${matchId}/emulation`),
          fetch(`/api/flairs?fid=${user.fid}`),
          fetch(`/api/flairs?fid=${matchData.player1_fid}`)
        ])
        const emulationData = await emulationRes.json()
        const myFlairData = await myFlairRes.json()
        const challengerFlairData = await challengerFlairRes.json()

        if (emulationData && !emulationData.error && matchData.questions) {
          setIsEmulationMode(true)
          setIsAsyncChallenge(false)
          const mappedAnswers = (emulationData.answers || []).map((a: any) => ({
            questionId: matchData.questions[a.question_number]?.id || '',
            answer: a.answer,
            isCorrect: a.is_correct,
            timeTaken: a.time_taken_ms,
            points: a.points_earned
          }))
          setChallengerAnswers(mappedAnswers)
          setAsyncQuestions(matchData.questions)

          setCurrentMatch({
            match_id: matchId,
            myPlayer: {
              fid: user.fid,
              username: user.username,
              displayName: user.displayName,
              pfpUrl: user.pfpUrl,
              activeFlair: myFlairData.active_flair
            },
            opponent: {
              fid: emulationData.opponent.fid,
              username: emulationData.opponent.username,
              displayName: emulationData.opponent.display_name,
              pfpUrl: emulationData.opponent.pfp_url,
              activeFlair: challengerFlairData.active_flair
            }
          })
          sessionStorage.setItem('isChallenge', 'true')
          setCurrentScreen("matchFound")

          // Show VS screen for 3 seconds then start emulation game
          setTimeout(() => {
            setCurrentScreen("game")
            sessionStorage.removeItem('isChallenge')
          }, 3000)
          return
        }
      }

      // SCENARIO 2: Challenger still playing (opponent accepts while challenger mid-game)
      if (matchData.from_redis && !isPlayer1 && !matchData.player1_completed_at) {
        console.log('[fetchMatchAndStart] SCENARIO 2: Challenger is currently playing - show alert')
        alert('Your opponent is currently playing. Please try again in a few minutes!')
        setCurrentScreen('challenges')
        return
      }

      // SCENARIO 1 & LIVE: Normal match start (live Socket.IO or player1 starting async)
      // Live matches have is_async=false, async challenges have is_async=false after 30s conversion
      console.log('[fetchMatchAndStart] SCENARIO 1 or LIVE: Normal match start')
      console.log('[fetchMatchAndStart] is_async:', matchData.is_async)
      console.log('[fetchMatchAndStart] match_type:', matchData.match_type)

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
      console.log('[fetchMatchAndStart] Set screen to game')
    } else {
      console.error('[fetchMatchAndStart] Missing matchData or user:', { matchData, user })
    }
  }

  // Update game screen state
  useEffect(() => {
    setIsGameScreen(currentScreen === "game" || currentScreen === "matchmaking")
  }, [currentScreen, setIsGameScreen])


  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic)
    setCurrentScreen("matchmaking")

    // Fetch display name
    try {
      const response = await fetch('/api/topics')
      const data = await response.json()
      const foundTopic = data.topics.find((t: any) => t.slug === topic)
      if (foundTopic) {
        setSelectedTopicDisplayName(foundTopic.display_name)
      }
    } catch (error) {
      console.error('Failed to fetch topic name:', error)
      setSelectedTopicDisplayName(topic) // Fallback to slug
    }
  }

  const handleMatchmakingComplete = (matchData: MatchData) => {
    setCurrentMatch(matchData)
    setCurrentScreen("game")
  }

  const handleGameEnd = () => {
    setCurrentScreen("topics")
    setSelectedTopic(null)
    setSelectedTopicDisplayName(null)
    setCurrentMatch(null)
  }

  const handleCancelChallenge = async () => {
    // Clear any polling intervals and timeouts
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (asyncTimeoutRef.current) {
      clearTimeout(asyncTimeoutRef.current)
      asyncTimeoutRef.current = null
    }

    if (pendingChallengeMatchId && user) {
      try {
        // Find the challenge ID for this match
        const response = await fetch(`/api/challenges?fid=${user.fid}&type=sent`)
        const data = await response.json()
        const challenge = data.challenges?.find((c: any) => c.match_id === pendingChallengeMatchId)

        if (challenge) {
          // Cancel the challenge via decline action
          await fetch('/api/challenges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'decline',
              challenge_id: challenge.id,
            })
          })
        }
      } catch (error) {
        console.error('Failed to cancel challenge:', error)
      }
    }
    setPendingChallengeMatchId(null)
    setWaitingForOpponent(false)
    setCurrentScreen('topics')
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
              {platform === 'world' ? (
                <>
                  <Globe className="w-5 h-5" />
                  Sign In with World ID
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In with Farcaster
                </>
              )}
            </span>
          </motion.button>
          <p className="mt-4 text-xs text-muted-foreground">
            {platform === 'world' ? 'Running in World App' : 'Running in Farcaster'}
          </p>
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
              {selectedTopicDisplayName || selectedTopic}
            </p>

            {/* Pro tip */}
            <motion.div
              key={currentTipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-center px-4 mb-4"
            >
              <p className="text-sm text-muted-foreground font-semibold">
                {shuffledTips[currentTipIndex]}
              </p>
            </motion.div>

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

            <p className="text-xs text-muted-foreground mb-6">
              {waitingType === 'join'
                ? "If they don't join, you'll play async"
                : "Waiting for them to finish their match..."}
            </p>

            {/* Buttons */}
            <div className="space-y-2 w-full max-w-xs mx-auto">
              {/* Go Async Button - Only show during challenge wait */}
              {waitingType === 'join' && (
                <button
                  onPointerDown={() => {
                    if (asyncCountdown <= 15) {
                      triggerAsyncMode()
                    }
                  }}
                  disabled={asyncCountdown > 15}
                  className={`w-full px-6 py-3 rounded-xl brutal-border font-bold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                    asyncCountdown > 15
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      : 'brutal-violet text-foreground cursor-pointer active:scale-95'
                  }`}
                  style={{ cursor: asyncCountdown > 15 ? 'not-allowed' : 'pointer' }}
                >
                  GO ASYNC ({asyncCountdown})
                </button>
              )}

              {/* Cancel Button */}
              <button
                onPointerDown={handleCancelChallenge}
                className="w-full brutal-border bg-background px-6 py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-sm uppercase tracking-wide flex items-center gap-2 justify-center active:scale-95 transition-transform"
                style={{ cursor: 'pointer' }}
              >
                <XIcon className="w-4 h-4" />
                Cancel
              </button>
            </div>
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
        {currentScreen === "matchFound" && selectedTopic && currentMatch && (
          <MatchFound
            topic={selectedTopic}
            myPlayer={currentMatch.myPlayer}
            opponent={currentMatch.opponent}
            isChallenge={typeof window !== 'undefined' ? sessionStorage.getItem('isChallenge') === 'true' : false}
          />
        )}
        {currentScreen === "game" && selectedTopic && currentMatch && (
          isEmulationMode && asyncQuestions.length > 0 && challengerAnswers.length > 0 ? (
            <AsyncEmulationGame
              matchId={currentMatch.match_id}
              myPlayer={currentMatch.myPlayer}
              challenger={currentMatch.opponent}
              topic={selectedTopic}
              questions={asyncQuestions}
              challengerAnswers={challengerAnswers}
              onGameEnd={handleGameEnd}
            />
          ) : isAsyncChallenge && asyncQuestions.length > 0 ? (
            <AsyncSoloGame
              matchId={currentMatch.match_id}
              myPlayer={currentMatch.myPlayer}
              opponent={currentMatch.opponent}
              topic={selectedTopic}
              questions={asyncQuestions}
              onGameEnd={handleGameEnd}
            />
          ) : (
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
          )
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
        {currentScreen === "challenges" && !showChallengeSent && (
          <Challenges
            user={user}
            onNavigate={setCurrentScreen}
          />
        )}
        {showChallengeSent && challengeSentData && (
          <ChallengeSentScreen
            playerScore={challengeSentData.playerScore}
            playerAnswers={challengeSentData.playerAnswers}
            opponentName={challengeSentData.opponentName}
            topic={challengeSentData.topic}
            onPlayAgain={() => {
              setShowChallengeSent(false)
              setChallengeSentData(null)
              setCurrentScreen('topics')
            }}
            onGoHome={() => {
              setShowChallengeSent(false)
              setChallengeSentData(null)
              setCurrentScreen('topics')
            }}
            onBack={() => {
              setShowChallengeSent(false)
              setChallengeSentData(null)
            }}
          />
        )}
      </div>
    </main>
  )
}
