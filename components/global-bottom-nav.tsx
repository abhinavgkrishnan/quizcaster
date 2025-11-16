"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Home, Users, Trophy, Bell, User } from "lucide-react"
import { useAppContext } from "@/lib/contexts/AppContext"
import BottomNav from "./bottom-nav"
import type { AppScreen } from "@/lib/types"

const GLOBAL_MENU_ITEMS = [
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
    <BottomNav
      currentScreen={currentScreen}
      onNavigate={handleNavigate}
      menuItems={GLOBAL_MENU_ITEMS}
      animated={false}
      fixed={true}
    />
  )
}
