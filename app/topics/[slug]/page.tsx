"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Play, Users, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFarcaster } from "@/lib/farcaster-sdk"
import FriendsList from "@/components/friends-list"

interface TopicPageProps {
  params: Promise<{ slug: string }>
}

interface Topic {
  slug: string
  display_name: string
  description: string
  icon_name?: string
  color_class?: string
  question_count: number
}

export default function TopicPage({ params }: TopicPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const { user } = useFarcaster()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

  useEffect(() => {
    fetchTopic()
    fetchLeaderboard()
  }, [slug])

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true)
      const response = await fetch(`/api/leaderboard?topic=${slug}&limit=10&sortBy=winrate`)
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  const fetchTopic = async () => {
    try {
      const response = await fetch('/api/topics')
      const data = await response.json()
      const foundTopic = data.topics?.find((t: Topic) => t.slug === slug)
      setTopic(foundTopic || null)
    } catch (error) {
      console.error('Failed to fetch topic:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFindMatch = () => {
    // Navigate to home with matchmaking trigger
    window.location.href = `/?matchmaking=${slug}`
  }

  const handleChallengeFriend = async (friend: any) => {
    try {
      if (!user?.fid) {
        alert('Please sign in to send challenges')
        return
      }

      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          challenger_fid: user.fid,
          challenged_fid: friend.fid,
          topic: slug
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Challenge sent to ${friend.display_name}! 🎮`)
        setShowFriendsModal(false)
      } else {
        alert(data.error || 'Failed to send challenge')
      }
    } catch (error) {
      console.error('Challenge error:', error)
      alert('Failed to send challenge')
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto h-screen flex items-center justify-center bg-card">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Loading...
        </p>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="w-full max-w-2xl mx-auto h-screen flex flex-col items-center justify-center bg-card p-6">
        <Info className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Topic Not Found
        </p>
        <button
          onClick={() => router.back()}
          className="brutal-violet brutal-border px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold uppercase tracking-wider"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none brutal-border bg-secondary border-x-0 border-t-0 border-b-2 p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="brutal-border bg-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold uppercase tracking-wider text-foreground">
              {topic.display_name}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="brutal-white brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-foreground flex-none mt-0.5" />
            <div className="flex-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">
                About This Topic
              </h2>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {topic.description || 'No description available.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFindMatch}
            className="w-full brutal-violet brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full brutal-border bg-background flex items-center justify-center">
              <Play className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                Find Match
              </p>
              <p className="text-xs text-foreground/60">
                Get matched with an online opponent
              </p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFriendsModal(true)}
            className="w-full brutal-beige brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full brutal-border bg-background flex items-center justify-center">
              <Users className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                Challenge a Friend
              </p>
              <p className="text-xs text-foreground/60">
                Select a friend to challenge
              </p>
            </div>
          </motion.button>
        </div>

        {/* Topic Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 brutal-white brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Top Players
          </p>
          {loadingLeaderboard ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-xs text-muted-foreground">No players yet</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry: any, index: number) => (
                <button
                  key={entry.fid}
                  onClick={() => router.push(`/profile/${entry.fid}`)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-background/50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-bold text-foreground/60 w-6">#{index + 1}</span>
                  <div className="w-8 h-8 rounded-full brutal-border overflow-hidden">
                    {entry.pfpUrl ? (
                      <img src={entry.pfpUrl} alt={entry.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-background" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{entry.displayName}</p>
                    <p className="text-[10px] text-foreground/60 truncate">@{entry.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{entry.winRate}%</p>
                    <p className="text-[10px] text-foreground/60">{entry.wins}W</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <FriendsList
            user={user}
            onClose={() => setShowFriendsModal(false)}
            onChallenge={(friend) => {
              handleChallengeFriend(friend)
              setShowFriendsModal(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
