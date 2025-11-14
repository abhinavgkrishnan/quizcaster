"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, X, Swords } from "lucide-react"
import type { FarcasterUser } from "@/lib/types"

interface Friend {
  fid: number
  username: string
  display_name: string
  pfp_url?: string
  active_flair?: any
}

interface FriendsListModalProps {
  user: FarcasterUser | null
  onClose: () => void
  onChallenge: (friend: Friend) => void
}

export default function FriendsListModal({ user, onClose, onChallenge }: FriendsListModalProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.fid) {
        setLoading(false)
        return
      }
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

    fetchFriends()
  }, [user?.fid])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full bg-card overflow-hidden max-h-[60vh] flex flex-col border-t-2 border-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none bg-secondary border-b-2 border-black px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h2 className="text-base font-bold uppercase tracking-wider">Select Friend</h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="brutal-border bg-background p-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Loading friends...
              </p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                No Friends Yet
              </p>
              <p className="text-[10px] text-muted-foreground">
                Add friends to challenge them!
              </p>
            </div>
          ) : (
            friends.map((friend, index) => (
              <motion.div
                key={friend.fid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="brutal-beige brutal-border p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full brutal-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
                      {friend.pfp_url ? (
                        <img src={friend.pfp_url} alt={friend.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-background" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{friend.display_name}</p>
                      <p className="text-[10px] text-foreground/60">@{friend.username}</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChallenge(friend)}
                    className="brutal-violet brutal-border p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Swords className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
