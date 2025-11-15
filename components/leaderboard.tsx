"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Trophy, Target, Clock, TrendingUp, ChevronDown, Medal } from "lucide-react"
import type { AppScreen } from "@/lib/types"
import { useFarcaster } from "@/lib/farcaster-sdk"

interface LeaderboardProps {
  onNavigate: (screen: AppScreen) => void
}

interface LeaderboardEntry {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  winRate: number
  accuracy: number
  avgTime: number
  bestStreak: number
}

const SORT_OPTIONS = [
  { value: 'winrate', label: 'Win Rate', icon: Trophy },
  { value: 'accuracy', label: 'Accuracy', icon: Target },
  { value: 'avgtime', label: 'Avg Time', icon: Clock },
  { value: 'streak', label: 'Best Streak', icon: TrendingUp },
]

// Import User icon at top
import { User, Home } from "lucide-react"

// Import Users icon
import { Users } from "lucide-react"

// MENU_ITEMS removed - using global BottomNav from layout

export default function Leaderboard({ onNavigate }: LeaderboardProps) {
  const { user } = useFarcaster()
  const [topics, setTopics] = useState<Array<{ slug: string; display_name: string }>>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('winrate')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopicDropdown, setShowTopicDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setShowTopicDropdown(false)
      setShowSortDropdown(false)
    }
    if (showTopicDropdown || showSortDropdown) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showTopicDropdown, showSortDropdown])

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics')
        const data = await response.json()
        setTopics(data.topics)
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      }
    }
    fetchTopics()
  }, [])

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          sortBy,
          limit: '50',
        })
        if (selectedTopic) {
          params.append('topic', selectedTopic)
        }

        const response = await fetch(`/api/leaderboard?${params}`)
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [selectedTopic, sortBy])

  const selectedSortOption = SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0]
  const SortIcon = selectedSortOption.icon

  return (
    <div className="w-full h-screen flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 pt-6 pb-4 relative z-10 bg-card">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">Leaderboard</h1>
          <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Top Players
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 relative z-50">
          {/* Topic Selector */}
          <div className="relative flex-1 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTopicDropdown(!showTopicDropdown)
                setShowSortDropdown(false)
              }}
              className="w-full brutal-white brutal-border px-4 py-3 rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide flex items-center justify-between relative z-10"
            >
              <span className="truncate">
                {selectedTopic ? topics.find(t => t.slug === selectedTopic)?.display_name : 'Overall'}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
            </button>

            {showTopicDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 brutal-white brutal-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-[100] max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedTopic(null)
                    setShowTopicDropdown(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors border-b-2 border-black"
                >
                  Overall
                </button>
                {topics.map(topic => (
                  <button
                    key={topic.slug}
                    onClick={() => {
                      setSelectedTopic(topic.slug)
                      setShowTopicDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors border-b-2 border-black last:border-b-0"
                  >
                    {topic.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative z-50">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowSortDropdown(!showSortDropdown)
                setShowTopicDropdown(false)
              }}
              className="brutal-violet brutal-border px-4 py-3 rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 relative z-10"
            >
              <SortIcon className="w-4 h-4" />
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 brutal-white brutal-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-[100] min-w-[180px]">
                {SORT_OPTIONS.map(option => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors border-b-2 border-black last:border-b-0 flex items-center gap-2 ${sortBy === option.value ? 'bg-gray-100' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24 relative z-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div className="space-y-2 pt-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="brutal-white brutal-border p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse"
              >
                <div className="flex items-center gap-3">
                  {/* Rank skeleton */}
                  <div className="flex-shrink-0 w-8">
                    <div className="h-6 w-6 bg-gray-200 rounded-full mx-auto" />
                  </div>
                  {/* Avatar skeleton */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200" />
                  {/* Info skeleton */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  {/* Stats skeleton */}
                  <div className="flex-shrink-0 text-right space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                    <div className="h-3 bg-gray-200 rounded w-12 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
              No data yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = user?.fid === entry.fid
              const bgColor = isCurrentUser ? 'brutal-violet' : 'brutal-beige'

              return (
                <button
                  key={entry.fid}
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 10px, 0)',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.04}s forwards`,
                  }}
                  onClick={() => {
                    if (!isCurrentUser) {
                      sessionStorage.setItem('profileReferrer', 'leaderboard')
                      window.location.href = `/profile/${entry.fid}`
                    }
                  }}
                  className={`${bgColor} border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 w-full text-left hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isCurrentUser ? 'cursor-default' : ''}`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-lg font-bold text-foreground">#{index + 1}</span>
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full brutal-border overflow-hidden bg-gray-200">
                    {entry.pfpUrl ? (
                      <img src={entry.pfpUrl} alt={entry.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                        {entry.displayName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {isCurrentUser ? 'You' : entry.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right">
                    {sortBy === 'winrate' && (
                      <div>
                        <p className="text-xl font-bold text-foreground">{entry.winRate}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {entry.wins}W {entry.losses}L
                        </p>
                      </div>
                    )}
                    {sortBy === 'accuracy' && (
                      <div>
                        <p className="text-xl font-bold text-foreground">{entry.accuracy}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Accuracy
                        </p>
                      </div>
                    )}
                    {sortBy === 'avgtime' && (
                      <div>
                        <p className="text-xl font-bold text-foreground">{entry.avgTime}s</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Avg Time
                        </p>
                      </div>
                    )}
                    {sortBy === 'streak' && (
                      <div>
                        <p className="text-xl font-bold text-foreground">{entry.bestStreak}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Best Streak
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom nav removed - now in global layout */}
    </div>
  )
}
