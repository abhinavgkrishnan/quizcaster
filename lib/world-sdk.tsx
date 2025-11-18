"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { MiniKit, VerificationLevel, type MiniAppWalletAuthSuccessPayload } from "@worldcoin/minikit-js"
import { supabase } from "@/lib/utils/supabase"
import type { TablesInsert } from "@/lib/database.types"

interface WorldUser {
  fid?: number
  username: string
  displayName: string
  pfpUrl: string
  walletAddress: string
}

interface WorldContextType {
  isSDKLoaded: boolean
  user: WorldUser | null
  isAuthenticated: boolean
  isWorldApp: boolean
  signIn: () => Promise<void>
  signOut: () => void
  verifyWorldID: (action: string) => Promise<any>
}

const WorldContext = createContext<WorldContextType>({
  isSDKLoaded: false,
  user: null,
  isAuthenticated: false,
  isWorldApp: false,
  signIn: async () => {},
  signOut: () => {},
  verifyWorldID: async () => null,
})

export function WorldProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [user, setUser] = useState<WorldUser | null>(null)
  const [isWorldApp, setIsWorldApp] = useState(false)

  useEffect(() => {
    const initMiniKit = async () => {
      try {
        // Install MiniKit
        MiniKit.install()

        // Check if we're in World App
        const installed = MiniKit.isInstalled()
        setIsWorldApp(installed)

        if (installed) {
          // Get user info if already authenticated
          const worldUser = MiniKit.user

          if (worldUser?.walletAddress) {
            const userData: WorldUser = {
              username: worldUser.username || worldUser.walletAddress.slice(0, 8),
              displayName: worldUser.username || "World User",
              pfpUrl: worldUser.profilePictureUrl || "",
              walletAddress: worldUser.walletAddress,
            }

            setUser(userData)

            // Store user in database (using wallet address as unique identifier)
            // We'll use a negative FID to distinguish World users from Farcaster users
            const worldFid = -parseInt(userData.walletAddress.slice(2, 10), 16)

            const userRecord: TablesInsert<'users'> = {
              fid: worldFid,
              username: userData.username,
              display_name: userData.displayName,
              pfp_url: userData.pfpUrl,
              last_active: new Date().toISOString()
            }
            await supabase.from('users').upsert(userRecord)
          }
        }

        setIsSDKLoaded(true)
      } catch (error) {
        console.error("Failed to initialize MiniKit:", error)
        setIsSDKLoaded(true)
      }
    }

    initMiniKit()
  }, [])

  const signIn = async () => {
    try {
      if (!MiniKit.isInstalled()) {
        console.log("MiniKit not installed - not in World App")
        return
      }

      // Generate nonce (in production, get this from your backend)
      const nonce = Math.random().toString(36).substring(7)

      // Perform wallet authentication
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        notBefore: new Date(Date.now()),
        statement: "Sign in to QuizCaster",
      })

      if (finalPayload.status === "success") {
        const payload = finalPayload as MiniAppWalletAuthSuccessPayload

        // Get user info from MiniKit
        const worldUser = MiniKit.user

        const userData: WorldUser = {
          username: worldUser?.username || payload.address.slice(0, 8),
          displayName: worldUser?.username || "World User",
          pfpUrl: worldUser?.profilePictureUrl || "",
          walletAddress: payload.address,
        }

        setUser(userData)

        // Store user in database
        const worldFid = -parseInt(userData.walletAddress.slice(2, 10), 16)

        const userRecord: TablesInsert<'users'> = {
          fid: worldFid,
          username: userData.username,
          display_name: userData.displayName,
          pfp_url: userData.pfpUrl,
          last_active: new Date().toISOString()
        }
        await supabase.from('users').upsert(userRecord)

        // Verify signature on backend in production
        // await fetch('/api/world-auth', {
        //   method: 'POST',
        //   body: JSON.stringify(payload)
        // })
      }
    } catch (error) {
      console.error("World sign in failed:", error)
    }
  }

  const signOut = () => {
    setUser(null)
  }

  const verifyWorldID = async (action: string) => {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("Not in World App")
      }

      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action,
        verification_level: VerificationLevel.Orb, // Orb verification for unique humans
      })

      if (finalPayload.status === "success") {
        // Verify the proof on backend
        const response = await fetch('/api/world-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: finalPayload,
            action,
          }),
        })

        const result = await response.json()
        return result
      }

      return null
    } catch (error) {
      console.error("World ID verification failed:", error)
      return null
    }
  }

  return (
    <WorldContext.Provider
      value={{
        isSDKLoaded,
        user,
        isAuthenticated: !!user,
        isWorldApp,
        signIn,
        signOut,
        verifyWorldID,
      }}
    >
      {children}
    </WorldContext.Provider>
  )
}

export function useWorld() {
  const context = useContext(WorldContext)
  if (!context) {
    throw new Error("useWorld must be used within WorldProvider")
  }
  return context
}
