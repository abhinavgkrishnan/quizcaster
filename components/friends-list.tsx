"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, X, UserPlus, Swords, Clock } from "lucide-react"
import type { FarcasterUser, AppScreen } from "@/lib/types"
import BottomNav from "./bottom-nav"

interface Friend {
  fid: number
  username: string
  display_name: string
  pfp_url?: string
  active_flair?: any
}

interface FriendRequest {
  id: string
  requester_fid: number
  created_at: string
  requester: Friend
}

interface FriendsListProps {
  user: FarcasterUser | null
  onClose?: () => void
  onChallenge?: (friend: Friend) => void
  onNavigate?: (screen: AppScreen) => void
  currentScreen?: AppScreen
}

export default function FriendsList({ user, onClose, onChallenge, onNavigate, currentScreen }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'friends' | 'requests'>('friends')

  useEffect(() => {
    if (user?.fid) {
      fetchFriends()
      fetchRequests()
    }
  }, [user?.fid])

  const fetchFriends = async () => {
    if (!user?.fid) return
    try {
      const response = await fetch(`/api/friends?fid=${user.fid}`)
      const data = await response.json()
      setFriends(data.friends || [])
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    if (!user?.fid) return
    try {
      const response = await fetch(`/api/friends?fid=${user.fid}&action=pending`)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  const handleAccept = async (friendshipId: string) => {
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          friendship_id: friendshipId
        })
      })
      fetchFriends()
      fetchRequests()
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  const handleDecline = async (friendshipId: string) => {
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline',
          friendship_id: friendshipId
        })
      })
      fetchRequests()
    } catch (error) {
      console.error('Failed to decline request:', error)
    }
  }

  const handleSendRequest = async (targetFid: number) => {
    if (!user?.fid) return
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_request',
          requester_fid: user.fid,
          addressee_fid: targetFid
        })
      })
      const data = await response.json()
      if (response.ok) {
        alert('Friend request sent!')
      } else {
        alert(data.error || 'Failed to send request')
      }
    } catch (error) {
      console.error('Failed to send request:', error)
    }
  }

  // Fetch followers from Neynar
  const [followers, setFollowers] = useState<any[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(true)

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!user?.fid) {
        setLoadingFollowers(false)
        return
      }
      try {
        setLoadingFollowers(true)
        const response = await fetch(`/api/followers?fid=${user.fid}`)
        const data = await response.json()
        console.log('[Friends List] Fetched followers:', data.followers?.length || 0)
        setFollowers(data.followers || [])
      } catch (error) {
        console.error('Failed to fetch followers:', error)
        setFollowers([])
      } finally {
        setLoadingFollowers(false)
      }
    }
    fetchFollowers()
  }, [user?.fid])

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none brutal-border bg-secondary border-x-0 border-t-0 border-b-2 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h1 className="text-lg font-bold uppercase tracking-wider">Friends</h1>
          </div>
          {onClose && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="brutal-border bg-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('friends')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === 'friends'
                ? 'brutal-violet brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-background text-muted-foreground'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors relative ${
              tab === 'requests'
                ? 'brutal-violet brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-background text-muted-foreground'
            }`}
          >
            Requests ({requests.length})
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center brutal-border">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        {tab === 'friends' && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Loading friends...
                </p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  No Friends Yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Add friends to challenge them!
                </p>
              </div>
            ) : (
              friends.map((friend, index) => (
                <motion.div
                  key={friend.fid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="brutal-beige brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {friend.pfp_url ? (
                          <img src={friend.pfp_url} alt={friend.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-background" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{friend.display_name}</p>
                        <p className="text-xs text-foreground/60">@{friend.username}</p>
                        {friend.active_flair && (
                          <p className="text-[10px] text-foreground/50 mt-0.5">
                            {friend.active_flair.icon} {friend.active_flair.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onChallenge?.(friend)}
                      className="brutal-violet brutal-border p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Swords className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}

        {tab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  No Pending Requests
                </p>
              </div>
            ) : (
              requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="brutal-white brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {request.requester.pfp_url ? (
                          <img src={request.requester.pfp_url} alt={request.requester.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-background" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{request.requester.display_name}</p>
                        <p className="text-xs text-foreground/60">@{request.requester.username}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAccept(request.id)}
                      className="flex-1 brutal-violet brutal-border py-2 px-4 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider">Accept</p>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDecline(request.id)}
                      className="flex-1 brutal-beige brutal-border py-2 px-4 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider">Decline</p>
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}
      </div>

      {/* Followers Section */}
      <div className="flex-none p-4 brutal-border border-x-0 border-b-0 border-t-2 bg-secondary max-h-48 overflow-y-auto">
        {loadingFollowers ? (
          <p className="text-xs text-center text-muted-foreground">
            Loading followers...
          </p>
        ) : followers.length > 0 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3">
              People You Follow ({followers.length})
            </p>
            <div className="space-y-2">
              {followers.slice(0, 10).map((follower: any) => {
                const isAlreadyFriend = friends.some(f => f.fid === follower.fid)
                return (
                  <div key={follower.fid} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full brutal-border overflow-hidden bg-white">
                        {follower.pfp_url ? (
                          <img src={follower.pfp_url} alt={follower.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-background" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{follower.display_name}</p>
                        <p className="text-[10px] text-foreground/60">@{follower.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => isAlreadyFriend ? onChallenge?.(follower) : handleSendRequest(follower.fid)}
                      className="brutal-violet brutal-border px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-bold uppercase tracking-wider"
                    >
                      {isAlreadyFriend ? 'Challenge' : 'Add'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-center text-muted-foreground">
            No followers found
          </p>
        )}
      </div>

      {/* Bottom nav removed - now in global layout */}
    </div>
  )
}
