"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { supabase } from "@/lib/utils/supabase"
import type { TablesInsert } from "@/lib/database.types"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
}

interface FarcasterContextType {
  isSDKLoaded: boolean
  user: FarcasterUser | null
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  user: null,
  isAuthenticated: false,
  signIn: async () => {},
  signOut: () => {},
})

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [user, setUser] = useState<FarcasterUser | null>(null)

  useEffect(() => {
    const initSDK = async () => {
      try {
        // Get context from SDK (it's a Promise)
        const context = await sdk.context

        // If user is already authenticated via context
        if (context?.user) {
          const userData = {
            fid: context.user.fid,
            username: context.user.username || `user${context.user.fid}`,
            displayName: context.user.displayName || "Farcaster User",
            pfpUrl: context.user.pfpUrl || "",
          }

          setUser(userData)

          // Upsert user to database
          const userRecord: TablesInsert<'users'> = {
            fid: userData.fid,
            username: userData.username,
            display_name: userData.displayName,
            pfp_url: userData.pfpUrl,
            last_active: new Date().toISOString()
          }
          await supabase.from('users').upsert(userRecord)
        }

        setIsSDKLoaded(true)

        // Call ready to hide splash screen
        await sdk.actions.ready()
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error)
        setIsSDKLoaded(true)

        // Still call ready even if context fails
        try {
          await sdk.actions.ready()
        } catch (e) {
          console.error("Failed to call ready:", e)
        }
      }
    }

    initSDK()
  }, [])

  const signIn = async () => {
    try {
      // Generate a nonce (you should get this from your backend in production)
      const nonce = Math.random().toString(36).substring(7)

      // Use Sign In with Farcaster
      const result = await sdk.actions.signIn({ nonce })

      if (result) {
        // Get updated context after sign in
        const context = await sdk.context
        if (context?.user) {
          const userData = {
            fid: context.user.fid,
            username: context.user.username || `user${context.user.fid}`,
            displayName: context.user.displayName || "Farcaster User",
            pfpUrl: context.user.pfpUrl || "",
          }

          setUser(userData)

          // Upsert user to database
          const userRecord: TablesInsert<'users'> = {
            fid: userData.fid,
            username: userData.username,
            display_name: userData.displayName,
            pfp_url: userData.pfpUrl,
            last_active: new Date().toISOString()
          }
          await supabase.from('users').upsert(userRecord)
        }
      }
    } catch (error) {
      console.error("Sign in failed:", error)
    }
  }

  const signOut = () => {
    setUser(null)
  }

  return (
    <FarcasterContext.Provider
      value={{
        isSDKLoaded,
        user,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}

export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error("useFarcaster must be used within FarcasterProvider")
  }
  return context
}
