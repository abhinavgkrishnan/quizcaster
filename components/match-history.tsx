"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Trophy, X, Filter, ChevronDown } from "lucide-react"
import type { FarcasterUser, AppScreen } from "@/lib/types"
import BottomNav from "./bottom-nav"
import GameOver from "./game-over"

interface Match {
  id: string
  topic: string
  my_score: number
  opponent_score: number
  result: 'win' | 'loss' | 'draw'
  opponent: {
    fid: number
    username: string
    display_name: string
    pfp_url?: string
    active_flair?: any
  }
  completed_at: string
  is_async: boolean
}

interface MatchHistoryProps {
  user: FarcasterUser | null
  onClose?: () => void
  onNavigate?: (screen: AppScreen) => void
  currentScreen?: AppScreen
  onFriendsClick?: () => void
}

export default function MatchHistory({ user, onClose, onNavigate, currentScreen, onFriendsClick }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [filterTopic, setFilterTopic] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [topics, setTopics] = useState<string[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [loadingMatchDetails, setLoadingMatchDetails] = useState(false)

  const observerTarget = useRef<HTMLDivElement>(null)
  const LIMIT = 20

  // Fetch available topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics')
        const data = await response.json()
        setTopics((data.topics || []).map((t: any) => t.slug))
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      }
    }
    fetchTopics()
  }, [])

  // Fetch matches
  const fetchMatches = useCallback(async (reset = false) => {
    if (!user?.fid) return

    try {
      setLoading(true)
      const currentOffset = reset ? 0 : offset

      let url = `/api/matches/history?fid=${user.fid}&limit=${LIMIT}&offset=${currentOffset}`
      if (filterTopic) url += `&topic=${filterTopic}`

      const response = await fetch(url)
      const data = await response.json()

      if (reset) {
        setMatches(data.matches || [])
        setOffset(LIMIT)
      } else {
        setMatches(prev => [...prev, ...(data.matches || [])])
        setOffset(prev => prev + LIMIT)
      }

      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to fetch match history:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.fid, offset, filterTopic])

  // Initial load
  useEffect(() => {
    fetchMatches(true)
  }, [filterTopic])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMatches()
        }
      },
      { threshold: 0.5 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, fetchMatches])

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'brutal-violet'
      case 'loss': return 'brutal-beige'
      case 'draw': return 'brutal-white'
      default: return 'brutal-white'
    }
  }

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return 'VICTORY'
      case 'loss': return 'DEFEAT'
      case 'draw': return 'DRAW'
      default: return 'UNKNOWN'
    }
  }

  const handleMatchClick = async (match: Match) => {
    if (!user?.fid) return

    setLoadingMatchDetails(true)
    try {
      const response = await fetch(`/api/matches/${match.id}/details?fid=${user.fid}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedMatch(data)
      } else {
        console.error('Failed to fetch match details:', data.error)
        alert('Failed to load match details')
      }
    } catch (error) {
      console.error('Error fetching match details:', error)
      alert('Failed to load match details')
    } finally {
      setLoadingMatchDetails(false)
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none bg-secondary border-b-2 border-black px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <h1 className="text-lg font-bold uppercase tracking-wider">Match History</h1>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="brutal-border bg-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Filter className="w-4 h-4" />
            </motion.button>
            {onClose && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="brutal-border bg-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4"
          >
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="w-full brutal-border bg-background p-2 rounded-lg text-sm font-semibold uppercase tracking-wider"
            >
              <option value="">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </motion.div>
        )}
      </div>

      {/* Matches List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        {matches.length === 0 && !loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm font-semibold uppercase tracking-wider">No matches found</p>
          </div>
        ) : (
          matches.map((match, index) => (
            <motion.button
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleMatchClick(match)}
              className="relative brutal-border p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-card w-full text-left hover:scale-[1.02] transition-transform active:scale-[0.98]"
            >
              {/* Score Bar - Subtle Background */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-10">
                <div className="flex h-full">
                  <div
                    style={{ width: `${(match.my_score / (match.my_score + match.opponent_score || 1)) * 100}%` }}
                    className="bg-violet-600"
                  />
                  <div className="flex-1 bg-amber-200" />
                </div>
              </div>

              {/* Header Row: PFPs and Result */}
              <div className="relative flex items-center justify-between mb-2">
                {/* My Side */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-8 h-8 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
                    {user?.pfpUrl ? (
                      <img src={user.pfpUrl} alt={user.displayName} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-violet-200" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-foreground/70 uppercase">ME</p>
                </div>

                {/* Center: Result & Topic */}
                <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-0.5">
                    {getResultText(match.result)}
                  </p>
                  <p className="text-[10px] text-foreground/60 uppercase tracking-wider">
                    {match.topic}
                  </p>
                </div>

                {/* Opponent Side */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-8 h-8 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
                    {match.opponent?.pfp_url ? (
                      <img src={match.opponent.pfp_url} alt={match.opponent.display_name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-amber-200" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-foreground/70 uppercase truncate max-w-[60px]">
                    @{match.opponent?.username || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Scores Row */}
              <div className="relative flex items-center justify-between px-4">
                <div className="text-2xl font-bold text-foreground">{match.my_score}</div>
                <div className="text-xs text-foreground/40 font-bold">-</div>
                <div className="text-2xl font-bold text-foreground">{match.opponent_score}</div>
              </div>

              {match.is_async && (
                <p className="text-[10px] text-foreground/60 mt-1.5 uppercase tracking-wider text-center">
                  Async Challenge
                </p>
              )}
            </motion.button>
          ))
        )}

        {/* Loading indicator / Observer target */}
        <div ref={observerTarget} className="py-4 text-center">
          {loading && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Loading...
            </p>
          )}
          {!hasMore && matches.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              No more matches
            </p>
          )}
        </div>
      </div>

      {/* Bottom nav removed - now in global layout */}

      {/* Game Over Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/90">
          <GameOver
            playerScore={selectedMatch.my_score}
            opponentScore={selectedMatch.opponent_score}
            playerAnswers={selectedMatch.my_answers}
            opponent={{
              username: selectedMatch.opponent.username,
              displayName: selectedMatch.opponent.displayName,
              pfpUrl: selectedMatch.opponent.pfpUrl
            }}
            opponentRequestedRematch={false}
            forfeitedBy={selectedMatch.forfeited_by}
            myFid={user?.fid || 0}
            topic={selectedMatch.topic}
            isHistorical={true}
            onPlayAgain={() => {}}
            onGoHome={() => setSelectedMatch(null)}
            onChallenge={() => {}}
            onBack={() => setSelectedMatch(null)}
          />
        </div>
      )}

      {/* Loading overlay for match details */}
      {loadingMatchDetails && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="brutal-violet brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold uppercase tracking-wider">Loading match...</p>
          </div>
        </div>
      )}
    </div>
  )
}
