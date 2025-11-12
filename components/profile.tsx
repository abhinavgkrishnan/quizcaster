"use client"

import { motion } from "framer-motion"
import { User, Trophy, Target, Clock, Home, Search, Bell } from "lucide-react"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
}

interface ProfileProps {
  user: FarcasterUser | null
  onNavigate?: (screen: "topics" | "matchmaking" | "game" | "profile") => void
}

const MENU_ITEMS = [
  { icon: Home, label: "Home", screen: "topics" as const },
  { icon: Search, label: "Discover", screen: "topics" as const },
  { icon: Trophy, label: "Leaderboard", screen: "topics" as const },
  { icon: Bell, label: "Activity", screen: "topics" as const },
  { icon: User, label: "Profile", screen: "profile" as const },
]

export default function Profile({ user, onNavigate }: ProfileProps) {
  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex-1 overflow-y-auto px-6 py-8"
      >
        {/* Profile Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="mb-6 flex justify-center"
          >
            <div className="w-32 h-32 rounded-full brutal-violet brutal-border flex items-center justify-center overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
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
            className="text-3xl font-bold text-foreground mb-2"
          >
            {user?.displayName || "Player"}
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground font-semibold uppercase tracking-wider"
          >
            @{user?.username || "user"}
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="brutal-violet brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-foreground" />
              <p className="text-sm font-bold uppercase tracking-wide text-foreground">Matches Played</p>
            </div>
            <p className="text-5xl font-bold text-foreground">0</p>
            <p className="text-xs text-foreground/60 font-semibold uppercase tracking-wider mt-2">
              Total Games
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="brutal-beige brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-foreground" />
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">Accuracy</p>
              </div>
              <p className="text-4xl font-bold text-foreground">0%</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="brutal-beige brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-foreground" />
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">Avg. Time</p>
              </div>
              <p className="text-4xl font-bold text-foreground">0s</p>
            </motion.div>
          </div>

          {/* Additional Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="brutal-white brutal-border p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-foreground mb-4">Performance</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Wins</span>
                <span className="font-bold text-foreground text-sm">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Losses</span>
                <span className="font-bold text-foreground text-sm">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">Win Rate</span>
                <span className="font-bold text-foreground text-sm">0%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

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
            return (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate?.(item.screen)}
                className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-all min-w-0 ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${isActive ? 'font-bold' : ''} truncate max-w-[60px] text-center`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-6 h-0.5 bg-foreground rounded-full" />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
