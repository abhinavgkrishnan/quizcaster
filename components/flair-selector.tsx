"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, X, Check, Lock, TrendingUp } from "lucide-react"

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
}

export default function FlairSelector({ fid, onClose, onFlairSelected }: FlairSelectorProps) {
  const [earnedFlairs, setEarnedFlairs] = useState<Flair[]>([])
  const [activeFlair, setActiveFlair] = useState<Flair | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFlair, setSelectedFlair] = useState<string | null>(null)
  const [allFlairs, setAllFlairs] = useState<Flair[]>([])
  const [currentWins, setCurrentWins] = useState<Record<string, number>>({})

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

  // Separate earned and locked flairs
  const earnedFlairIds = new Set(earnedFlairs.map(f => f.id))
  const lockedFlairs = allFlairs.filter(f => !earnedFlairIds.has(f.id))

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none brutal-border bg-secondary border-x-0 border-t-0 border-b-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <h1 className="text-lg font-bold uppercase tracking-wider">Your Flairs</h1>
          </div>
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

      {/* Flairs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            {earnedFlairs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 px-2">
                  Earned Flairs
                </p>
                {earnedFlairs.map((flair, index) => (
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
                  Locked Flairs
                </p>
                {lockedFlairs.map((flair, index) => {
                  const wins = currentWins[flair.topic || ''] || 0
                  const required = flair.requirement.count
                  const progress = Math.min((wins / required) * 100, 100)
                  const isClose = progress >= 50 // Show progress if > 50%

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

                      {/* Progress bar */}
                      {isClose && (
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

            {earnedFlairs.length === 0 && lockedFlairs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  No Flairs Available
                </p>
                <p className="text-xs text-muted-foreground">
                  Win matches to earn flairs!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
