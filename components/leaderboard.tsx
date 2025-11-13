"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, Target, Clock, TrendingUp, ChevronDown, Medal } from "lucide-react"
import type { AppScreen } from "@/lib/types"

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

const MENU_ITEMS = [
  { icon: Home, label: "Home", screen: "topics" as const },
  { icon: Target, label: "Discover", screen: "topics" as const },
  { icon: Trophy, label: "Leaderboard", screen: "leaderboard" as const },
  { icon: Clock, label: "Activity", screen: "topics" as const },
  { icon: User, label: "Profile", screen: "profile" as const },
]

export default function Leaderboard({ onNavigate }: LeaderboardProps) {
  const [topics, setTopics] = useState<Array<{ slug: string; display_name: string }>>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('winrate')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopicDropdown, setShowTopicDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

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
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 pt-6 pb-4">
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
        <div className="flex gap-2">
          {/* Topic Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setShowTopicDropdown(!showTopicDropdown)
                setShowSortDropdown(false)
              }}
              className="w-full brutal-white brutal-border px-4 py-3 rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide flex items-center justify-between"
            >
              <span className="truncate">
                {selectedTopic ? topics.find(t => t.slug === selectedTopic)?.display_name : 'Overall'}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
            </button>

            {showTopicDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 brutal-white brutal-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50 max-h-60 overflow-y-auto">
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
          <div className="relative">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown)
                setShowTopicDropdown(false)
              }}
              className="brutal-violet brutal-border px-4 py-3 rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
            >
              <SortIcon className="w-4 h-4" />
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 brutal-white brutal-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50 min-w-[180px]">
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
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full brutal-violet brutal-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="w-2 h-2 rounded-full bg-foreground" />
            </motion.div>
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
              const isTop3 = index < 3
              const bgColor = isTop3
                ? index === 0 ? 'brutal-violet' : index === 1 ? 'brutal-beige' : 'brutal-beige-light'
                : 'brutal-white'

              return (
                <motion.div
                  key={entry.fid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`${bgColor} brutal-border p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {isTop3 ? (
                      <Medal className={`w-6 h-6 ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-400' : 'text-amber-700'}`} fill="currentColor" />
                    ) : (
                      <span className="text-lg font-bold text-foreground">#{index + 1}</span>
                    )}
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
                    <p className="font-bold text-sm text-foreground truncate">{entry.displayName}</p>
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
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="flex-none brutal-border bg-secondary border-t-2 border-x-0 border-b-0"
      >
        <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.screen === "leaderboard"
            return (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate(item.screen)}
                className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-all min-w-0 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${isActive ? 'font-bold' : ''} truncate max-w-[60px] text-center`}>
                  {item.label}
                </span>
                {isActive && <div className="w-6 h-0.5 bg-foreground rounded-full" />}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
