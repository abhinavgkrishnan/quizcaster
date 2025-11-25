"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { AppScreen } from "@/lib/types"

interface AppContextType {
  currentScreen: AppScreen
  setCurrentScreen: (screen: AppScreen) => void
  isGameScreen: boolean
  setIsGameScreen: (isGame: boolean) => void
  isWaitingScreen: boolean
  setIsWaitingScreen: (isWaiting: boolean) => void
  isOverlayOpen: boolean
  setIsOverlayOpen: (isOpen: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("topics")
  const [isGameScreen, setIsGameScreen] = useState(false)
  const [isWaitingScreen, setIsWaitingScreen] = useState(false)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        isGameScreen,
        setIsGameScreen,
        isWaitingScreen,
        setIsWaitingScreen,
        isOverlayOpen,
        setIsOverlayOpen
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
