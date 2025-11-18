"use client"

import { createContext, useContext, ReactNode } from "react"
import { useFarcaster } from "@/lib/farcaster-sdk"
import { useWorld } from "@/lib/world-sdk"

export interface UnifiedUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  walletAddress?: string
  platform: 'farcaster' | 'world'
}

interface UnifiedAuthContextType {
  isSDKLoaded: boolean
  user: UnifiedUser | null
  isAuthenticated: boolean
  platform: 'farcaster' | 'world' | 'unknown'
  signIn: () => Promise<void>
  signOut: () => void
  verifyWorldID?: (action: string) => Promise<any>
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType>({
  isSDKLoaded: false,
  user: null,
  isAuthenticated: false,
  platform: 'unknown',
  signIn: async () => {},
  signOut: () => {},
})

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const farcaster = useFarcaster()
  const world = useWorld()

  // Determine which platform we're on and which user to use
  const getPlatform = (): 'farcaster' | 'world' | 'unknown' => {
    if (world.isWorldApp && world.isAuthenticated) return 'world'
    if (farcaster.isAuthenticated) return 'farcaster'
    if (world.isWorldApp) return 'world'
    return 'farcaster' // Default to Farcaster
  }

  const platform = getPlatform()

  // Create unified user object
  const getUnifiedUser = (): UnifiedUser | null => {
    if (platform === 'world' && world.user) {
      return {
        // Use derived FID from wallet address for World users
        fid: -parseInt(world.user.walletAddress.slice(2, 10), 16),
        username: world.user.username,
        displayName: world.user.displayName,
        pfpUrl: world.user.pfpUrl,
        walletAddress: world.user.walletAddress,
        platform: 'world',
      }
    }

    if (platform === 'farcaster' && farcaster.user) {
      return {
        fid: farcaster.user.fid,
        username: farcaster.user.username,
        displayName: farcaster.user.displayName,
        pfpUrl: farcaster.user.pfpUrl,
        platform: 'farcaster',
      }
    }

    return null
  }

  const user = getUnifiedUser()

  const signIn = async () => {
    if (platform === 'world') {
      await world.signIn()
    } else {
      await farcaster.signIn()
    }
  }

  const signOut = () => {
    if (platform === 'world') {
      world.signOut()
    } else {
      farcaster.signOut()
    }
  }

  return (
    <UnifiedAuthContext.Provider
      value={{
        isSDKLoaded: farcaster.isSDKLoaded && world.isSDKLoaded,
        user,
        isAuthenticated: !!user,
        platform,
        signIn,
        signOut,
        verifyWorldID: world.verifyWorldID,
      }}
    >
      {children}
    </UnifiedAuthContext.Provider>
  )
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext)
  if (!context) {
    throw new Error("useUnifiedAuth must be used within UnifiedAuthProvider")
  }
  return context
}
