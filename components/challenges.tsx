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
  challenged: {
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
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([])
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')

  useEffect(() => {
    if (user?.fid) {
      fetchChallenges()
    }
  }, [user?.fid])

  const fetchChallenges = async () => {
    if (!user?.fid) return

    try {
      setLoading(true)
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`/api/challenges?fid=${user.fid}&type=received`),
        fetch(`/api/challenges?fid=${user.fid}&type=sent`)
      ])
      const [receivedData, sentData] = await Promise.all([
        receivedRes.json(),
        sentRes.json()
      ])
      setReceivedChallenges(receivedData.challenges || [])
      setSentChallenges(sentData.challenges || [])
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (challenge: Challenge) => {
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          challenge_id: challenge.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Challenges] Accepting challenge:', data)

        if (data.is_live) {
          // Live game - navigate directly to match (Socket.IO)
          console.log('[Challenges] Starting LIVE game:', challenge.match_id)
          router.push(`/?match=${challenge.match_id}`)
        } else {
          // Async game - navigate to emulation
          console.log('[Challenges] Starting ASYNC emulation:', challenge.match_id)
          router.push(`/?challenge=${challenge.match_id}&topic=${challenge.topic}&opponent=${challenge.challenger_fid}&mode=emulation`)
        }
        fetchChallenges()
      } else {
        console.error('[Challenges] Accept failed:', await response.text())
        alert('Failed to accept challenge')
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

  const handleCancel = async (challengeId: string) => {
    try {
      await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          challenge_id: challengeId
        })
      })

      fetchChallenges()
    } catch (error) {
      console.error('Failed to cancel challenge:', error)
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
          <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-4">
            Manage your challenges
          </p>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 brutal-border px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                activeTab === 'received' ? 'brutal-violet' : 'brutal-white'
              }`}
            >
              Received ({receivedChallenges.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 brutal-border px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                activeTab === 'sent' ? 'brutal-violet' : 'brutal-white'
              }`}
            >
              Sent ({sentChallenges.length})
            </button>
          </div>
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
        ) : (activeTab === 'received' ? receivedChallenges : sentChallenges).length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {activeTab === 'received' ? 'No Received Challenges' : 'No Sent Challenges'}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'received' ? 'Your friends can challenge you!' : 'Challenge friends to start playing!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(activeTab === 'received' ? receivedChallenges : sentChallenges).map((challenge, index) => {
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
                  {/* Challenge Card */}
                  <div className="flex items-stretch justify-between gap-4">
                    {/* Left Column: PFP, Username, Topic stacked vertically */}
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
                          {(activeTab === 'received' ? challenge.challenger.pfp_url : challenge.challenged.pfp_url) ? (
                            <img
                              src={activeTab === 'received' ? challenge.challenger.pfp_url : challenge.challenged.pfp_url}
                              alt={activeTab === 'received' ? challenge.challenger.display_name : challenge.challenged.display_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-violet-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-bold text-foreground truncate">{activeTab === 'received' ? challenge.challenger.display_name : challenge.challenged.display_name}</p>
                          <p className="text-sm text-foreground/60 truncate">@{activeTab === 'received' ? challenge.challenger.username : challenge.challenged.username}</p>
                        </div>
                      </div>
                      <div className="brutal-beige brutal-border px-5 py-2.5 rounded-full text-center">
                        <p className="text-lg font-bold uppercase tracking-wide">{challenge.topic}</p>
                      </div>
                    </div>

                    {/* Right Column: Accept/Reject buttons stacked */}
                    {activeTab === 'received' ? (
                      <div className="flex flex-col gap-2 justify-center">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAccept(challenge)}
                          className="brutal-white brutal-border rounded-xl px-6 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 min-w-[120px]"
                        >
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider">Accept</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDecline(challenge.id)}
                          className="brutal-border bg-background rounded-full w-12 h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto"
                        >
                          <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                            <XIcon className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancel(challenge.id)}
                          className="brutal-white brutal-border rounded-xl px-6 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <XIcon className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider">Cancel</span>
                        </motion.button>
                      </div>
                    )}
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
