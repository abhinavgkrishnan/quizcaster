"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Trophy, X, Filter, ChevronDown } from "lucide-react"
import type { FarcasterUser, AppScreen } from "@/lib/types"
import BottomNav from "./bottom-nav"
import GameOver from "./game-over"
import { TEXT } from "@/lib/constants"

interface Match {
  id: string
  topic: string
  my_score: number
  opponent_score: number
  result: 'win' | 'loss' | 'draw'
  player: {
    fid: number
    username: string
    display_name: string
    pfp_url?: string
    active_flair?: any
  }
  opponent: {
    fid: number
    username: string
    display_name: string
    pfp_url?: string
    active_flair?: any
  }
  completed_at: string
  is_async: boolean
  forfeited_by?: number | null
}

interface MatchHistoryProps {
  user: FarcasterUser | null
  onClose?: () => void
  onNavigate?: (screen: AppScreen) => void
  currentScreen?: AppScreen
  onFriendsClick?: () => void
  isOwnProfile?: boolean
}

export default function MatchHistory({ user, onClose, onNavigate, currentScreen, onFriendsClick, isOwnProfile = true }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [filterTopic, setFilterTopic] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [showTopicDropdown, setShowTopicDropdown] = useState(false)
  const [topics, setTopics] = useState<Array<{ slug: string; display_name: string }>>([])
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
        setTopics(data.topics || [])
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      }
    }
    fetchTopics()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setShowTopicDropdown(false)
    if (showTopicDropdown) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showTopicDropdown])

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
      case 'win': return TEXT.MATCH_HISTORY.VICTORY_LABEL
      case 'loss': return TEXT.MATCH_HISTORY.DEFEAT_LABEL
      case 'draw': return TEXT.MATCH_HISTORY.DRAW_LABEL
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
      <div className="flex-none bg-secondary border-b-2 border-black px-4 py-4 relative z-50">
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
            className="mt-4 relative z-[100]"
          >
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTopicDropdown(!showTopicDropdown)
                }}
                className="w-full brutal-white brutal-border px-4 py-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between text-sm font-bold uppercase tracking-wide"
              >
                <span>{filterTopic ? topics.find(t => t.slug === filterTopic)?.display_name : 'All Topics'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showTopicDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 brutal-white brutal-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-[200]">
                  <button
                    onClick={() => {
                      setFilterTopic('')
                      setShowTopicDropdown(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors border-b-2 border-black ${filterTopic === '' ? 'bg-gray-100' : ''}`}
                  >
                    All Topics
                  </button>
                  {topics.map(topic => (
                    <button
                      key={topic.slug}
                      onClick={() => {
                        setFilterTopic(topic.slug)
                        setShowTopicDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors border-b-2 border-black last:border-b-0 ${filterTopic === topic.slug ? 'bg-gray-100' : ''}`}
                    >
                      {topic.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Matches List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24 relative z-10" style={{ WebkitOverflowScrolling: 'touch' }}>
        {matches.length === 0 && !loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm font-semibold uppercase tracking-wider">No matches found</p>
          </div>
        ) : (
          matches.map((match, index) => {
            const playerForfeited = match.forfeited_by === match.player?.fid
            const opponentForfeited = match.forfeited_by === match.opponent?.fid
            const hasForfeit = playerForfeited || opponentForfeited

            return (
            <motion.div
              key={match.id}
              style={{
                opacity: 0,
                transform: 'translate3d(0, 10px, 0)',
                animation: `fadeInUp 0.4s ease-out ${index * 0.03}s forwards`,
              }}
              onClick={isOwnProfile ? () => handleMatchClick(match) : undefined}
              className={`relative brutal-border p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-card w-full ${isOwnProfile ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-transform`}
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
                {/* Player Side */}
                <div className="flex flex-col items-center gap-1 flex-1 min-h-[60px]">
                  <div className="w-8 h-8 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
                    {match.player?.pfp_url ? (
                      <img src={match.player.pfp_url} alt={match.player.display_name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-violet-200" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-foreground/70 uppercase truncate max-w-[100px]">
                    {isOwnProfile ? 'ME' : `@${match.player?.username || 'Unknown'}`}
                  </p>
                  <div className="h-3">
                    {match.player?.active_flair && (
                      <p className="text-[8px] text-foreground/60">
                        {match.player.active_flair.icon}
                      </p>
                    )}
                  </div>
                </div>

                {/* Center: Result & Topic */}
                <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-0.5">
                    {playerForfeited ? (isOwnProfile ? TEXT.MATCH_HISTORY.DEFEAT_FORFEIT : `${match.player.username?.toUpperCase()} FORFEIT`) : opponentForfeited ? (isOwnProfile ? TEXT.MATCH_HISTORY.VICTORY_FORFEIT : `${match.opponent.username?.toUpperCase()} FORFEIT`) : getResultText(match.result)}
                  </p>
                  <p className="text-[10px] text-foreground/60 uppercase tracking-wider">
                    {topics.find(t => t.slug === match.topic)?.display_name || match.topic}
                  </p>
                  <p className="text-[8px] text-foreground/40 mt-0.5">
                    {new Date(match.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })} {new Date(match.completed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </p>
                </div>

                {/* Opponent Side */}
                <div className="flex flex-col items-center gap-1 flex-1 min-h-[60px]">
                  <div className="w-8 h-8 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
                    {match.opponent?.pfp_url ? (
                      <img src={match.opponent.pfp_url} alt={match.opponent.display_name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-amber-200" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-foreground/70 uppercase truncate max-w-[100px]">
                    @{match.opponent?.username || 'Unknown'}
                  </p>
                  <div className="h-3">
                    {match.opponent?.active_flair && (
                      <p className="text-[8px] text-foreground/60">
                        {match.opponent.active_flair.icon}
                      </p>
                    )}
                  </div>
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
            </motion.div>
            )
          })
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
