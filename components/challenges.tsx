"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Check, X as XIcon, Swords } from "lucide-react"
import * as Icons from "lucide-react"
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

interface Topic {
  slug: string
  display_name: string
  icon_name: string | null
  color_class: string | null
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
  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    if (user?.fid) {
      fetchChallenges()
      fetchTopics()
    }
  }, [user?.fid])

  // Refetch challenges when user returns to the page/tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.fid) {
        fetchChallenges()
      }
    }

    const handleFocus = () => {
      if (user?.fid) {
        fetchChallenges()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user?.fid])

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics')
      const data = await response.json()
      setTopics(data.topics || [])
    } catch (error) {
      console.error('Failed to fetch topics:', error)
    }
  }

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

        // Use window.location.href to trigger full page navigation
        // This ensures the useEffect in page.tsx runs and handles the match logic
        if (data.is_live) {
          // Live game - navigate directly to match (Socket.IO)
          console.log('[Challenges] Starting LIVE game:', challenge.match_id)
          window.location.href = `/?match=${challenge.match_id}`
        } else {
          // Async game - let page.tsx fetchMatchAndStart handle the logic
          // It will check if challenger finished and start emulation or show waiting screen
          console.log('[Challenges] Starting ASYNC game:', challenge.match_id)
          window.location.href = `/?match=${challenge.match_id}`
        }
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

  const handleViewScore = async (challenge: Challenge) => {
    // Navigate to show the challenge sent screen with your score
    router.push(`/?view_challenge=${challenge.match_id}`)
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

              // Get topic data for icon and color
              const topicData = topics.find(t => t.slug === challenge.topic)
              const TopicIcon = topicData?.icon_name ? (Icons as any)[topicData.icon_name] : Icons.HelpCircle
              const topicBgColor = topicData?.color_class ? `#${topicData.color_class.replace('#', '')}` : '#FEFFDD'

              return (
                <div
                  key={challenge.id}
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 10px, 0)',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.04}s forwards`,
                  }}
                  className="brutal-violet brutal-border p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                >
                  {/* Challenge Card */}
                  <div className="flex items-center gap-3">
                    {/* Layout: For received - stacked (PFP+Name, Topic) on left, buttons on right. For sent - PFP+Name on top, Topic+Button in a row below */}
                    {activeTab === 'received' ? (
                      <>
                        {/* Left Column: PFP, Username, Topic stacked vertically */}
                        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
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
                            <div className="flex-1 min-w-0">
                              <p className="text-lg font-bold text-foreground truncate">{challenge.challenger.display_name}</p>
                              <p className="text-sm text-foreground/60 truncate">@{challenge.challenger.username}</p>
                            </div>
                          </div>

                          {/* Topic Card - matching topic-selection style */}
                          <div style={{ backgroundColor: topicBgColor }} className="brutal-border rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 flex items-center justify-center gap-2">
                            <TopicIcon className="w-6 h-6 stroke-[2.5] text-foreground" />
                            <p className="text-sm font-bold uppercase tracking-wide text-foreground">{topicData?.display_name || challenge.topic}</p>
                          </div>
                        </div>

                        {/* Right Column: Accept/Reject buttons stacked */}
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAccept(challenge)}
                            className="brutal-white brutal-border rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 w-[100px]"
                          >
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide">Accept</span>
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDecline(challenge.id)}
                            className="brutal-white brutal-border rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 w-[100px]"
                          >
                            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                              <XIcon className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide">Reject</span>
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      /* Sent tab: Stack everything vertically - PFP+Name first, then Topic+Button in a row */
                      <div className="flex flex-col gap-2.5 flex-1">
                        {/* PFP and Name */}
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white flex-shrink-0">
                            {challenge.challenged.pfp_url ? (
                              <img
                                src={challenge.challenged.pfp_url}
                                alt={challenge.challenged.display_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-violet-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold text-foreground truncate">{challenge.challenged.display_name}</p>
                            <p className="text-sm text-foreground/60 truncate">@{challenge.challenged.username}</p>
                          </div>
                        </div>

                        {/* Topic and Button in a row */}
                        <div className="flex items-center gap-2">
                          {/* Topic Card - matching topic-selection style */}
                          <div style={{ backgroundColor: topicBgColor }} className="brutal-border rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 flex items-center justify-center gap-2 flex-1">
                            <TopicIcon className="w-6 h-6 stroke-[2.5] text-foreground" />
                            <p className="text-sm font-bold uppercase tracking-wide text-foreground">{topicData?.display_name || challenge.topic}</p>
                          </div>

                          {/* View Score Button aligned with topic - same color as topic */}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewScore(challenge)}
                            style={{ backgroundColor: topicBgColor }}
                            className="brutal-border rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 flex-shrink-0"
                          >
                            <Swords className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">View Score</span>
                          </motion.button>
                        </div>
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
