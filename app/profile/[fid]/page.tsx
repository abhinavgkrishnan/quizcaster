"use client"

import { useEffect, useState, use } from "react"
import { motion } from "framer-motion"
import { User, Trophy, Target, Clock, ArrowLeft, TrendingUp, Swords, UserPlus, Home, Users, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFarcaster } from "@/lib/farcaster-sdk"
import MatchHistory from "@/components/match-history"
import FriendsList from "@/components/friends-list"
import BottomNav from "@/components/bottom-nav"
import ChallengeTopicSelector from "@/components/challenge-topic-selector"
import type { AppScreen } from "@/lib/types"

interface OtherProfilePageProps {
  params: Promise<{ fid: string }>
}

interface UserInfo {
  fid: number
  username: string
  display_name: string
  pfp_url?: string
  active_flair?: any
}

interface UserStats {
  overall: {
    total_matches: number
    total_wins: number
    total_losses: number
    total_draws: number
    win_rate: string
    accuracy: string
    avg_response_time_s: string
    current_streak: number
    longest_streak: number
  }
  top_topics?: Array<{
    topic: string
    matches_played: number
    matches_won: number
  }>
}

export default function OtherProfilePage({ params }: OtherProfilePageProps) {
  const { fid } = use(params)
  const router = useRouter()
  const { user: currentUser } = useFarcaster()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMatchHistory, setShowMatchHistory] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [showTopicSelector, setShowTopicSelector] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("profile")
  const [challengeLoading, setChallengeLoading] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [fid])

  const fetchUserProfile = async () => {
    try {
      // Fetch user info from Neynar
      const userResponse = await fetch(`/api/users/${fid}`)
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }
      const userData = await userResponse.json()

      // Fetch stats
      const statsResponse = await fetch(`/api/stats/${fid}`)
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch active flair
      const flairResponse = await fetch(`/api/flairs?fid=${fid}`)
      const flairData = await flairResponse.json()

      setUser({
        fid: userData.fid || parseInt(fid),
        username: userData.username || 'unknown',
        display_name: userData.display_name || userData.username || 'User',
        pfp_url: userData.pfp_url || null,
        active_flair: flairData.active_flair || null
      })

      // Check if friends
      if (currentUser?.fid) {
        const friendsResponse = await fetch(`/api/friends?fid=${currentUser.fid}`)
        const friendsData = await friendsResponse.json()
        const isFriendUser = friendsData.friends?.some((f: any) => f.fid === parseInt(fid))
        setIsFriend(isFriendUser)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const [currentUserFid, setCurrentUserFid] = useState<number | null>(null)

  useEffect(() => {
    // Get current user FID from Farcaster SDK
    const getFid = async () => {
      try {
        const { useFarcaster } = await import('@/lib/farcaster-sdk')
        // This won't work in server component, need to pass from parent
      } catch (e) {}
    }
    getFid()
  }, [])

  const handleChallenge = () => {
    setShowTopicSelector(true)
  }

  const handleTopicSelected = async (topic: string) => {
    try {
      if (!currentUser?.fid) {
        alert('Please sign in to send challenges')
        return
      }

      setChallengeLoading(true)
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          challenger_fid: currentUser.fid,
          challenged_fid: parseInt(fid),
          topic
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Challenge sent! 🎮`)
        setShowTopicSelector(false)
      } else {
        alert(data.error || 'Failed to send challenge')
      }
    } catch (error) {
      console.error('Failed to send challenge:', error)
      alert('Error sending challenge')
    } finally {
      setChallengeLoading(false)
    }
  }

  const handleAddFriend = async () => {
    try {
      if (!currentUser?.fid) {
        alert('Please sign in to add friends')
        return
      }

      if (currentUser.fid === parseInt(fid)) {
        alert('You cannot add yourself as a friend!')
        return
      }

      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_request',
          requester_fid: currentUser.fid,
          addressee_fid: parseInt(fid)
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Friend request sent!')
      } else {
        alert(data.error || 'Failed to send friend request')
      }
    } catch (error) {
      console.error('Failed to send friend request:', error)
      alert('Error sending friend request')
    }
  }

  const displayStats = stats?.overall || {
    total_matches: 0,
    total_wins: 0,
    total_losses: 0,
    total_draws: 0,
    win_rate: '0',
    accuracy: '0',
    avg_response_time_s: '0',
    current_streak: 0,
    longest_streak: 0
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

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex-none brutal-border bg-secondary border-x-0 border-t-0 border-b-2 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="brutal-border bg-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleChallenge}
              disabled={challengeLoading}
              className="brutal-violet brutal-border px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 disabled:opacity-50 touch-manipulation"
            >
              <Swords className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {challengeLoading ? 'Sending...' : 'Challenge'}
              </span>
            </motion.button>
            {!isFriend && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddFriend}
                className="brutal-beige brutal-border px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Add Friend</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex-1 overflow-y-auto overflow-x-hidden px-[4%] py-6 pb-24"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Profile Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="mb-4 flex justify-center"
          >
            <div className="w-24 h-24 rounded-full brutal-violet brutal-border flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {user?.pfp_url ? (
                <img
                  src={user.pfp_url}
                  alt={user.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-foreground" />
              )}
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-foreground mb-1"
          >
            {user?.display_name}
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground font-semibold uppercase tracking-wider"
          >
            @{user?.username}
          </motion.p>
          {user?.active_flair && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2"
            >
              <div className="brutal-violet brutal-border px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-1">
                <span className="text-sm">{user.active_flair.icon}</span>
                <span className="text-xs font-bold">{user.active_flair.name}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Match History Button */}
        <div className="mb-6">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMatchHistory(true)}
            className="w-full brutal-beige brutal-border p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 justify-center"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Match History</span>
          </motion.button>
        </div>

        {/* Stats - Same as own profile */}
        <div className="space-y-3">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="brutal-violet brutal-border p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-foreground" />
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">Matches Played</p>
            </div>
            <p className="text-4xl font-bold text-foreground">
              {loading ? '...' : displayStats.total_matches}
            </p>
            <p className="text-[10px] text-foreground/60 font-semibold uppercase tracking-wider mt-1">
              Total Games
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="brutal-beige brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">Accuracy</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : `${displayStats.accuracy}%`}
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="brutal-beige brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-foreground">Avg. Time</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : `${displayStats.avg_response_time_s}s`}
              </p>
            </motion.div>
          </div>

          {/* Most Played Topics */}
          {stats?.top_topics && stats.top_topics.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="brutal-white brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-foreground mb-3">Most Played Topics</p>
              <div className="space-y-2">
                {stats.top_topics.map((topic, idx) => (
                  <div key={topic.topic} className="flex justify-between items-center">
                    <span className="text-foreground/70 text-xs uppercase tracking-wide font-semibold">
                      {idx + 1}. {topic.topic}
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {topic.matches_played} games
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Topic Selector Modal */}
      {showTopicSelector && (
        <div className="fixed inset-0 z-50">
          <ChallengeTopicSelector
            onSelect={handleTopicSelected}
            onClose={() => setShowTopicSelector(false)}
          />
        </div>
      )}

      {/* Match History Modal */}
      {showMatchHistory && user && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <MatchHistory
            user={{
              fid: user.fid,
              username: user.username || 'unknown',
              displayName: user.display_name || 'User',
              pfpUrl: user.pfp_url || undefined
            }}
            onClose={() => setShowMatchHistory(false)}
            onNavigate={(screen) => {
              setShowMatchHistory(false)
              router.push('/')
            }}
            currentScreen="profile"
            onFriendsClick={() => {
              setShowMatchHistory(false)
              setShowFriends(true)
            }}
          />
        </div>
      )}

      {/* Bottom nav removed - now in global layout */}
    </div>
  )
}
