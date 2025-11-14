"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Trophy, X, Filter, ChevronDown } from "lucide-react"
import type { FarcasterUser } from "@/lib/types"

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
}

export default function MatchHistory({ user, onClose }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [filterTopic, setFilterTopic] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [topics, setTopics] = useState<string[]>([])

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

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none brutal-border bg-secondary border-x-0 border-t-0 border-b-2 p-4">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {matches.length === 0 && !loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm font-semibold uppercase tracking-wider">No matches found</p>
          </div>
        ) : (
          matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${getResultColor(match.result)} brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* My PFP */}
                  <div className="w-10 h-10 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {user?.pfpUrl ? (
                      <img src={user.pfpUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-background" />
                    )}
                  </div>

                  {/* VS Text */}
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">VS</span>

                  {/* Opponent PFP */}
                  <div className="w-10 h-10 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {match.opponent?.pfp_url ? (
                      <img src={match.opponent.pfp_url} alt={match.opponent.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-background" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">
                      @{match.opponent?.username || 'Unknown'}
                    </p>
                    {match.opponent?.active_flair && (
                      <p className="text-[10px] text-foreground/60">
                        {match.opponent.active_flair.icon} {match.opponent.active_flair.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    {getResultText(match.result)}
                  </p>
                  <p className="text-[10px] text-foreground/60 uppercase tracking-wider">
                    {match.topic}
                  </p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="relative h-8 brutal-border rounded-full overflow-hidden bg-background">
                <div className="absolute inset-0 flex">
                  <div
                    style={{ width: `${(match.my_score / (match.my_score + match.opponent_score)) * 100}%` }}
                    className="bg-violet-500 transition-all"
                  />
                  <div className="flex-1 bg-amber-300" />
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold">
                  <span className="text-white mix-blend-difference">{match.my_score}</span>
                  <span className="text-white mix-blend-difference">{match.opponent_score}</span>
                </div>
              </div>

              {match.is_async && (
                <p className="text-[10px] text-foreground/60 mt-2 uppercase tracking-wider text-center">
                  Async Challenge
                </p>
              )}
            </motion.div>
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
    </div>
  )
}
