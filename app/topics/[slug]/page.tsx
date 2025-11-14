"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Play, Users, Info } from "lucide-react"
import { useRouter } from "next/navigation"
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
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFriends, setShowFriends] = useState(false)

  useEffect(() => {
    fetchTopic()
  }, [slug])

  const fetchTopic = async () => {
    try {
      const response = await fetch('/api/topics')
      const data = await response.json()
      const foundTopic = data.find((t: Topic) => t.slug === slug)
      setTopic(foundTopic || null)
    } catch (error) {
      console.error('Failed to fetch topic:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFindMatch = () => {
    // Navigate to matchmaking with topic
    router.push(`/?topic=${slug}`)
  }

  const handleChallengeFriend = (friend: any) => {
    // Create async challenge
    // TODO: Implement challenge creation
    console.log('Challenge friend:', friend, 'in topic:', slug)
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
            <p className="text-xs text-muted-foreground">
              {topic.question_count} questions
            </p>
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
            onClick={() => setShowFriends(true)}
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

        {/* Leaderboard Preview (Future) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 brutal-white brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Top Players
          </p>
          <p className="text-xs text-muted-foreground">
            Leaderboard coming soon...
          </p>
        </motion.div>
      </div>

      {/* Friends Modal */}
      {showFriends && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <FriendsList
            user={null} // TODO: Pass actual user from context
            onClose={() => setShowFriends(false)}
            onChallenge={(friend) => {
              handleChallengeFriend(friend)
              setShowFriends(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
