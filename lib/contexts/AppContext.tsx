"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { AppScreen } from "@/lib/types"

interface AppContextType {
  currentScreen: AppScreen
  setCurrentScreen: (screen: AppScreen) => void
  showFriends: boolean
  setShowFriends: (show: boolean) => void
  isGameScreen: boolean
  setIsGameScreen: (isGame: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("topics")
  const [showFriends, setShowFriends] = useState(false)
  const [isGameScreen, setIsGameScreen] = useState(false)

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        showFriends,
        setShowFriends,
        isGameScreen,
        setIsGameScreen
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider")
  }
  return context
}
