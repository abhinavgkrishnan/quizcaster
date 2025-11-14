"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Check, X as XIcon, Swords } from "lucide-react"
import type { FarcasterUser, AppScreen } from "@/lib/types"
import { useRouter } from "next/navigation"

interface Challenge {
  id: string
  match_id: string
  challenger_fid: number
  challenged_fid: number
  topic: string
  status: string
  created_at: string
  expires_at: string
  challenger: {
    fid: number
    username: string
    display_name: string
    pfp_url?: string
    active_flair?: any
  }
}

interface ChallengesProps {
  user: FarcasterUser | null
  onNavigate?: (screen: AppScreen) => void
}

export default function Challenges({ user, onNavigate }: ChallengesProps) {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.fid) {
      fetchChallenges()
    }
  }, [user?.fid])

  const fetchChallenges = async () => {
    if (!user?.fid) return

    try {
      setLoading(true)
      const response = await fetch(`/api/challenges?fid=${user.fid}&type=received`)
      const data = await response.json()
      setChallenges(data.challenges || [])
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (challengeId: string, matchId: string) => {
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          challenge_id: challengeId
        })
      })

      if (response.ok) {
        // Navigate to the match
        router.push(`/?match=${matchId}`)
        fetchChallenges()
      }
    } catch (error) {
      console.error('Failed to accept challenge:', error)
    }
  }

  const handleDecline = async (challengeId: string) => {
    try {
      await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline',
          challenge_id: challengeId
        })
      })

      fetchChallenges()
    } catch (error) {
      console.error('Failed to decline challenge:', error)
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">Challenges</h1>
          <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Pending challenges
          </p>
        </motion.div>
      </div>

      {/* Challenges List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full brutal-violet brutal-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="w-2 h-2 rounded-full bg-foreground" />
            </motion.div>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              No Pending Challenges
            </p>
            <p className="text-xs text-muted-foreground">
              Challenge friends to start playing!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((challenge, index) => {
              const isExpiringSoon = new Date(challenge.expires_at).getTime() - Date.now() < 3600000 // 1 hour

              return (
                <div
                  key={challenge.id}
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 10px, 0)',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.04}s forwards`,
                  }}
                  className="brutal-violet brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {/* Challenge Info */}
                  <div className="flex items-center gap-3 mb-4">
                    {/* Challenger PFP */}
                    <div className="w-12 h-12 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
                      {challenge.challenger.pfp_url ? (
                        <img
                          src={challenge.challenger.pfp_url}
                          alt={challenge.challenger.display_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-200" />
                      )}
                    </div>

                    {/* Challenger Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {challenge.challenger.display_name}
                      </p>
                      <p className="text-xs text-foreground/60 truncate">
                        @{challenge.challenger.username}
                      </p>
                      {challenge.challenger.active_flair && (
                        <p className="text-[10px] text-foreground/50 mt-0.5">
                          {challenge.challenger.active_flair.icon} {challenge.challenger.active_flair.name}
                        </p>
                      )}
                    </div>

                    {/* Challenge Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full brutal-border bg-background flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Swords className="w-5 h-5 text-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="mb-4">
                    <p className="text-xs text-foreground/60 uppercase tracking-wider mb-1">Challenge Topic</p>
                    <div className="brutal-beige brutal-border px-3 py-2 rounded-lg inline-block">
                      <p className="text-sm font-bold uppercase tracking-wide">{challenge.topic}</p>
                    </div>
                  </div>

                  {/* Expiry Warning */}
                  {isExpiringSoon && (
                    <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wider mb-3">
                      ⚠️ Expires soon!
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAccept(challenge.id, challenge.match_id)}
                      className="flex-1 brutal-white brutal-border rounded-full py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider">Accept</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDecline(challenge.id)}
                      className="w-12 h-12 brutal-border bg-background rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <XIcon className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    </motion.button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
