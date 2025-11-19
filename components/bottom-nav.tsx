"use client"

import { motion } from "framer-motion"
import { Home, Users, Trophy, Bell, User, type LucideIcon } from "lucide-react"
import type { AppScreen } from "@/lib/types"

interface MenuItem {
  icon: LucideIcon
  label: string
  screen: AppScreen
  key: string
}

interface BottomNavProps {
  currentScreen: AppScreen
  onNavigate: (screen: AppScreen) => void
  onFriendsClick?: () => void
  /** Optional custom menu items */
  menuItems?: MenuItem[]
  /** Whether to show initial animation */
  animated?: boolean
  /** Fixed positioning (for global nav) */
  fixed?: boolean
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { icon: Home, label: "Home", screen: "topics" as const, key: "home" },
  { icon: Users, label: "Friends", screen: "topics" as const, key: "friends" },
  { icon: Trophy, label: "Leaderboard", screen: "leaderboard" as const, key: "leaderboard" },
  { icon: Bell, label: "Activity", screen: "topics" as const, key: "activity" },
  { icon: User, label: "Profile", screen: "profile" as const, key: "profile" },
]

export default function BottomNav({
  currentScreen,
  onNavigate,
  onFriendsClick,
  menuItems = DEFAULT_MENU_ITEMS,
  animated = true,
  fixed = false
}: BottomNavProps) {
  const content = (
    <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive =
          (item.key === "home" && currentScreen === "topics") ||
          (item.key === "friends" && currentScreen === "friends") ||
          (item.key === "leaderboard" && currentScreen === "leaderboard") ||
          (item.key === "challenges" && currentScreen === "challenges") ||
          (item.key === "profile" && currentScreen === "profile")
        const isFriends = item.key === "friends"

        return (
          <button
            key={item.key}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isFriends && onFriendsClick) {
                onFriendsClick()
              } else {
                onNavigate(item.screen)
              }
            }}
            className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-transform min-w-0 touch-manipulation active:scale-95 ${
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
            style={{ cursor: 'pointer' }}
          >
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            {isActive && (
              <div className="w-6 h-0.5 bg-foreground rounded-full mt-1" />
            )}
          </button>
        )
      })}
    </div>
  )

  if (fixed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t-2 border-black" style={{ pointerEvents: 'auto' }}>
        {content}
      </div>
    )
  }

  if (animated) {
    return (
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="flex-none brutal-border bg-secondary border-t-2 border-x-0 border-b-0"
      >
        {content}
      </motion.div>
    )
  }

  return (
    <div className="flex-none brutal-border bg-secondary border-t-2 border-x-0 border-b-0">
      {content}
    </div>
  )
}
