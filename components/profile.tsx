"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Trophy, Target, Clock, Home, Users, Bell, TrendingUp, Award, History } from "lucide-react"
import type { FarcasterUser, AppScreen } from "@/lib/types"
import FlairSelector from "./flair-selector"
import MatchHistory from "./match-history"

interface ProfileProps {
  user: FarcasterUser | null
  onNavigate?: (screen: AppScreen) => void
  onFriendsClick?: () => void
}

interface UserStats {
  overall: {
    total_matches: number
    total_wins: number
    total_losses: number
    total_draws: number
    win_rate: string
    accuracy: string
    avg_response_time_s: string
    current_streak: number
    longest_streak: number
  }
  top_topics?: Array<{
    topic: string
    matches_played: number
    matches_won: number
  }>
}

const MENU_ITEMS = [
  { icon: Home, label: "Home", screen: "topics" as const },
  { icon: Users, label: "Friends", screen: "topics" as const },
  { icon: Trophy, label: "Leaderboard", screen: "leaderboard" as const },
  { icon: Bell, label: "Activity", screen: "topics" as const },
  { icon: User, label: "Profile", screen: "profile" as const },
]

export default function Profile({ user, onNavigate, onFriendsClick }: ProfileProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFlairSelector, setShowFlairSelector] = useState(false)
  const [showMatchHistory, setShowMatchHistory] = useState(false)
  const [activeFlair, setActiveFlair] = useState<any>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.fid) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/stats/${user.fid}`)
        const data = await response.json()
        setStats(data)

        // Fetch active flair
        const flairResponse = await fetch(`/api/flairs?fid=${user.fid}`)
        const flairData = await flairResponse.json()
        setActiveFlair(flairData.active_flair)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.fid])

  const displayStats = stats?.overall || {
    total_matches: 0,
    total_wins: 0,
    total_losses: 0,
    total_draws: 0,
    win_rate: '0',
    accuracy: '0',
    avg_response_time_s: '0',
    current_streak: 0,
    longest_streak: 0
  }

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex-1 overflow-y-auto overflow-x-hidden px-[4%] py-6"
      >
        {/* Profile Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="mb-4 flex justify-center"
          >
            <div className="w-24 h-24 rounded-full brutal-violet brutal-border flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {user?.pfpUrl ? (
                <img
                  src={user.pfpUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-foreground" />
              )}
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-foreground mb-1"
          >
            {user?.displayName || "Player"}
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground font-semibold uppercase tracking-wider"
          >
            @{user?.username || "user"}
          </motion.p>
          {activeFlair && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2"
            >
              <button
                onClick={() => setShowFlairSelector(true)}
                className="brutal-violet brutal-border px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-1 hover:scale-105 transition-transform"
              >
                <span className="text-sm">{activeFlair.icon}</span>
                <span className="text-xs font-bold">{activeFlair.name}</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFlairSelector(true)}
            className="brutal-beige brutal-border p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Manage Flair</span>
          </motion.button>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMatchHistory(true)}
            className="brutal-beige brutal-border p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Match History</span>
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="space-y-3">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="brutal-violet brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-foreground" />
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">Matches Played</p>
            </div>
            <p className="text-4xl font-bold text-foreground">
              {loading ? '...' : displayStats.total_matches}
            </p>
            <p className="text-[10px] text-foreground/60 font-semibold uppercase tracking-wider mt-1">
              Total Games
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="brutal-beige brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">Accuracy</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : `${displayStats.accuracy}%`}
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="brutal-beige brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">Avg. Time</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : `${displayStats.avg_response_time_s}s`}
              </p>
            </motion.div>
          </div>

          {/* Additional Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="brutal-white brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-foreground mb-3">Performance</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Wins</span>
                <span className="font-bold text-foreground text-sm">
                  {loading ? '...' : displayStats.total_wins}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Losses</span>
                <span className="font-bold text-foreground text-sm">
                  {loading ? '...' : displayStats.total_losses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Win Rate</span>
                <span className="font-bold text-foreground text-sm">
                  {loading ? '...' : `${displayStats.win_rate}%`}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="brutal-violet brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">Current</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : displayStats.current_streak}
              </p>
              <p className="text-[10px] text-foreground/60 font-semibold uppercase tracking-wider mt-1">
                Win Streak
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="brutal-beige brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">Best</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : displayStats.longest_streak}
              </p>
              <p className="text-[10px] text-foreground/60 font-semibold uppercase tracking-wider mt-1">
                Win Streak
              </p>
            </motion.div>
          </div>

          {/* Most Played Topics */}
          {stats?.top_topics && stats.top_topics.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="brutal-white brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-foreground mb-3">Most Played Topics</p>
              <div className="space-y-2">
                {stats.top_topics.map((topic, idx) => (
                  <div key={topic.topic} className="flex justify-between items-center">
                    <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">
                      {idx + 1}. {topic.topic}
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {topic.matches_played} games
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      {showFlairSelector && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <FlairSelector
            fid={user?.fid || 0}
            onClose={() => setShowFlairSelector(false)}
            onFlairSelected={(flair) => {
              setActiveFlair(flair)
              setShowFlairSelector(false)
            }}
            onNavigate={(screen: AppScreen) => {
              setShowFlairSelector(false)
              onNavigate?.(screen)
            }}
            currentScreen="profile"
            onFriendsClick={onFriendsClick}
          />
        </div>
      )}

      {showMatchHistory && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <MatchHistory
            user={user}
            onClose={() => setShowMatchHistory(false)}
            onNavigate={(screen: AppScreen) => {
              setShowMatchHistory(false)
              onNavigate?.(screen)
            }}
            currentScreen="profile"
            onFriendsClick={onFriendsClick}
          />
        </div>
      )}

      {/* Bottom Navigation Menu */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="flex-none brutal-border bg-secondary border-t-2 border-x-0 border-b-0"
      >
        <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.screen === "profile"
            const isFriends = item.label === "Friends"
            return (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => isFriends && onFriendsClick ? onFriendsClick() : onNavigate?.(item.screen)}
                className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-all min-w-0 ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                {isActive && (
                  <div className="w-6 h-0.5 bg-foreground rounded-full mt-1" />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
