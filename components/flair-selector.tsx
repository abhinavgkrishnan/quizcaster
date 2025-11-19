"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, X, Check, Lock, TrendingUp, Filter, ChevronDown } from "lucide-react"
import BottomNav from "./bottom-nav"
import type { AppScreen } from "@/lib/types"

interface Flair {
  id: string
  name: string
  description: string
  icon: string
  requirement: {
    type: string
    count: number
  }
  topic?: string
  earned_at?: string
}

interface FlairSelectorProps {
  fid: number
  onClose?: () => void
  onFlairSelected?: (flair: Flair | null) => void
  onNavigate?: (screen: AppScreen) => void
  currentScreen?: AppScreen
  onFriendsClick?: () => void
}

export default function FlairSelector({ fid, onClose, onFlairSelected, onNavigate, currentScreen, onFriendsClick }: FlairSelectorProps) {
  const [earnedFlairs, setEarnedFlairs] = useState<Flair[]>([])
  const [activeFlair, setActiveFlair] = useState<Flair | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFlair, setSelectedFlair] = useState<string | null>(null)
  const [allFlairs, setAllFlairs] = useState<Flair[]>([])
  const [currentWins, setCurrentWins] = useState<Record<string, number>>({})
  const [filterTopic, setFilterTopic] = useState<string>('')
  const [showTopicDropdown, setShowTopicDropdown] = useState(false)
  const [topics, setTopics] = useState<Array<{ slug: string; display_name: string }>>([])

  useEffect(() => {
    fetchFlairs()
  }, [fid])

  const fetchFlairs = async () => {
    try {
      // Fetch earned flairs
      const response = await fetch(`/api/flairs?fid=${fid}`)
      const data = await response.json()
      setEarnedFlairs(data.earned_flairs || [])
      setActiveFlair(data.active_flair)
      setSelectedFlair(data.active_flair?.id || null)

      // Fetch all available flairs from all topics
      const topicsResponse = await fetch('/api/topics')
      const topicsData = await topicsResponse.json()
      setTopics(topicsData.topics || [])

      const allAvailableFlairs: Flair[] = []
      const winsPerTopic: Record<string, number> = {}

      for (const topic of topicsData.topics || []) {
        // Get flairs for this topic
        const topicFlairResponse = await fetch(`/api/flairs?fid=${fid}&topic=${topic.slug}`)
        const topicFlairData = await topicFlairResponse.json()

        winsPerTopic[topic.slug] = topicFlairData.current_wins || 0

        // Add flairs with topic info
        const flairsWithTopic = (topicFlairData.available_flairs || []).map((f: Flair) => ({
          ...f,
          topic: topic.slug
        }))
        allAvailableFlairs.push(...flairsWithTopic)
      }

      setAllFlairs(allAvailableFlairs)
      setCurrentWins(winsPerTopic)
    } catch (error) {
      console.error('Failed to fetch flairs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (flair: Flair | null) => {
    try {
      const response = await fetch('/api/flairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          action: 'set_active',
          flair_id: flair?.id || null
        })
      })

      const data = await response.json()
      if (data.success) {
        setActiveFlair(flair)
        setSelectedFlair(flair?.id || null)
        onFlairSelected?.(flair)
      }
    } catch (error) {
      console.error('Failed to set active flair:', error)
    }
  }

  // Filter and sort flairs
  const earnedFlairIds = new Set(earnedFlairs.map(f => f.id))

  // Filter locked flairs by topic
  const filteredLockedFlairs = allFlairs
    .filter(f => !earnedFlairIds.has(f.id))
    .filter(f => !filterTopic || f.topic === filterTopic)

  // Sort locked flairs by how close they are to unlocking (smallest gap first)
  const lockedFlairs = filteredLockedFlairs.sort((a, b) => {
    const winsA = currentWins[a.topic || ''] || 0
    const winsB = currentWins[b.topic || ''] || 0
    const gapA = a.requirement.count - winsA // How many wins needed
    const gapB = b.requirement.count - winsB
    return gapA - gapB // Smallest gap (closest to unlock) first
  })

  // Filter earned flairs by topic
  const filteredEarnedFlairs = earnedFlairs.filter(f => !filterTopic || f.topic === filterTopic)

  return (
    <div className="w-full h-screen flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 pt-6 pb-4 relative z-10 bg-card">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <h1 className="text-4xl font-bold text-foreground">Your Flairs</h1>
            </div>
            {onClose && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="brutal-border bg-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
          <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Earn badges by winning
          </p>
        </motion.div>

        {/* Topic Filter - Same as Leaderboard */}
        <div className="relative z-20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowTopicDropdown(!showTopicDropdown)
            }}
            className="w-full brutal-white brutal-border px-3 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between text-xs font-bold uppercase tracking-wider"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3" />
              <span>{filterTopic ? topics.find(t => t.slug === filterTopic)?.display_name : 'All Topics'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTopicDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showTopicDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 brutal-white brutal-border rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50 bg-card"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFilterTopic('')
                  setShowTopicDropdown(false)
                }}
                className={`w-full px-3 py-2 text-left text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors ${
                  !filterTopic ? 'bg-violet-100' : ''
                }`}
              >
                All Topics
              </button>
              {topics.map(topic => (
                <button
                  key={topic.slug}
                  onClick={(e) => {
                    e.stopPropagation()
                    setFilterTopic(topic.slug)
                    setShowTopicDropdown(false)
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors border-t-2 border-black ${
                    filterTopic === topic.slug ? 'bg-violet-100' : ''
                  }`}
                >
                  {topic.display_name}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Flairs List */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* No Flair Option */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSetActive(null)}
          className={`w-full brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            selectedFlair === null ? 'brutal-violet' : 'brutal-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full brutal-border bg-background flex items-center justify-center">
                <X className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">No Flair</p>
                <p className="text-xs text-foreground/60">Don't display a flair</p>
              </div>
            </div>
            {selectedFlair === null && (
              <Check className="w-5 h-5 text-foreground" />
            )}
          </div>
        </motion.button>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Loading flairs...
            </p>
          </div>
        ) : (
          <>
            {/* Earned Flairs */}
            {filteredEarnedFlairs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 px-2">
                  Earned Flairs ({filteredEarnedFlairs.length})
                </p>
                {filteredEarnedFlairs.map((flair, index) => (
                  <motion.button
                    key={flair.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSetActive(flair)}
                    className={`w-full brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      selectedFlair === flair.id ? 'brutal-violet' : 'brutal-beige'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full brutal-border bg-background flex items-center justify-center text-2xl">
                          {flair.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">{flair.name}</p>
                          <p className="text-xs text-foreground/60">{flair.description}</p>
                          {flair.topic && (
                            <p className="text-[10px] text-foreground/50 uppercase tracking-wider mt-1">
                              {flair.topic}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedFlair === flair.id && (
                        <Check className="w-5 h-5 text-foreground" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Locked Flairs with Progress */}
            {lockedFlairs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 px-2">
                  Locked Flairs ({lockedFlairs.length})
                </p>
                {lockedFlairs.map((flair, index) => {
                  const wins = currentWins[flair.topic || ''] || 0
                  const required = flair.requirement.count
                  const progress = Math.min((wins / required) * 100, 100)
                  const hasProgress = wins > 0 // Show progress if they have at least 1 win

                  return (
                    <motion.div
                      key={flair.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (earnedFlairs.length + index) * 0.05 }}
                      className="w-full brutal-white brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-60"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full brutal-border bg-background flex items-center justify-center text-2xl relative">
                          <span className="opacity-30">{flair.icon}</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-foreground/40" />
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold text-foreground/70">{flair.name}</p>
                          <p className="text-xs text-foreground/50">{flair.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-foreground/40 uppercase tracking-wider">
                              {flair.topic}
                            </p>
                            <span className="text-[10px] text-foreground/40">•</span>
                            <p className="text-[10px] font-bold text-foreground/60">
                              {wins}/{required} wins
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar - Show if they have at least 1 win */}
                      {hasProgress && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] text-foreground/50 uppercase tracking-wider">Progress</p>
                            <p className="text-[10px] font-bold text-foreground/60">{Math.round(progress)}%</p>
                          </div>
                          <div className="h-2 bg-background brutal-border rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="h-full bg-violet-500"
                            />
                          </div>
                          <p className="text-[10px] text-foreground/40 mt-1 text-center">
                            {required - wins} more wins to unlock!
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {filteredEarnedFlairs.length === 0 && lockedFlairs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {filterTopic ? 'No Flairs in This Topic' : 'No Flairs Available'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filterTopic ? 'Try a different topic filter' : 'Win matches to earn flairs!'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom nav removed - now in global layout */}
    </div>
  )
}
