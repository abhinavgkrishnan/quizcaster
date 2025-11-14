"use client"

import { usePathname, useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { Home, Users, Trophy, Bell, User } from "lucide-react"
import { useAppContext } from "@/lib/contexts/AppContext"
import type { AppScreen } from "@/lib/types"

const MENU_ITEMS = [
  { icon: Home, label: "Home", screen: "topics" as const, key: "home" },
  { icon: Users, label: "Friends", screen: "friends" as const, key: "friends" },
  { icon: Trophy, label: "Leaderboard", screen: "leaderboard" as const, key: "leaderboard" },
  { icon: Bell, label: "Challenges", screen: "challenges" as const, key: "challenges" },
  { icon: User, label: "Profile", screen: "profile" as const, key: "profile" },
]

export default function GlobalBottomNav() {
  const { currentScreen, setCurrentScreen } = useAppContext()
  const pathname = usePathname()
  const router = useRouter()

  // Hide on game screens
  const isGameScreen = pathname?.includes('/game') || currentScreen === 'game'
  const isMatchmaking = currentScreen === 'matchmaking'

  if (isGameScreen || isMatchmaking) {
    return null
  }

  const handleNavigate = (screen: AppScreen) => {
    if (pathname !== '/') {
      router.push('/')
    }
    setCurrentScreen(screen)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-secondary border-t-2 border-black">
      <div className="flex items-center justify-around px-2 py-3">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            (item.key === "home" && currentScreen === "topics") ||
            (item.key === "friends" && currentScreen === "friends") ||
            (item.key === "leaderboard" && currentScreen === "leaderboard") ||
            (item.key === "challenges" && currentScreen === "challenges") ||
            (item.key === "profile" && currentScreen === "profile")

          return (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate(item.screen)}
              className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-all min-w-0 touch-manipulation active:scale-95 active:opacity-80 ${
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
    </div>
  )
}
