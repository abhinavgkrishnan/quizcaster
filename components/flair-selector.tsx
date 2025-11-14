"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, X, Check, Lock } from "lucide-react"

interface Flair {
  id: string
  name: string
  description: string
  icon: string
  requirement: {
    type: string
    count: number
  }
  topic?: string
  earned_at?: string
}

interface FlairSelectorProps {
  fid: number
  onClose?: () => void
  onFlairSelected?: (flair: Flair | null) => void
}

export default function FlairSelector({ fid, onClose, onFlairSelected }: FlairSelectorProps) {
  const [earnedFlairs, setEarnedFlairs] = useState<Flair[]>([])
  const [activeFlair, setActiveFlair] = useState<Flair | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFlair, setSelectedFlair] = useState<string | null>(null)

  useEffect(() => {
    fetchFlairs()
  }, [fid])

  const fetchFlairs = async () => {
    try {
      const response = await fetch(`/api/flairs?fid=${fid}`)
      const data = await response.json()
      setEarnedFlairs(data.earned_flairs || [])
      setActiveFlair(data.active_flair)
      setSelectedFlair(data.active_flair?.id || null)
    } catch (error) {
      console.error('Failed to fetch flairs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (flair: Flair | null) => {
    try {
      const response = await fetch('/api/flairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          action: 'set_active',
          flair_id: flair?.id || null
        })
      })

      const data = await response.json()
      if (data.success) {
        setActiveFlair(flair)
        setSelectedFlair(flair?.id || null)
        onFlairSelected?.(flair)
      }
    } catch (error) {
      console.error('Failed to set active flair:', error)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none brutal-border bg-secondary border-x-0 border-t-0 border-b-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <h1 className="text-lg font-bold uppercase tracking-wider">Select Flair</h1>
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
      </div>

      {/* Flairs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* No Flair Option */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSetActive(null)}
          className={`w-full brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            selectedFlair === null ? 'brutal-violet' : 'brutal-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full brutal-border bg-background flex items-center justify-center">
                <X className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">No Flair</p>
                <p className="text-xs text-foreground/60">Don't display a flair</p>
              </div>
            </div>
            {selectedFlair === null && (
              <Check className="w-5 h-5 text-foreground" />
            )}
          </div>
        </motion.button>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Loading flairs...
            </p>
          </div>
        ) : earnedFlairs.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              No Flairs Earned Yet
            </p>
            <p className="text-xs text-muted-foreground">
              Win matches to earn flairs!
            </p>
          </div>
        ) : (
          earnedFlairs.map((flair, index) => (
            <motion.button
              key={flair.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSetActive(flair)}
              className={`w-full brutal-border p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                selectedFlair === flair.id ? 'brutal-violet' : 'brutal-beige'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full brutal-border bg-background flex items-center justify-center text-2xl">
                    {flair.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{flair.name}</p>
                    <p className="text-xs text-foreground/60">{flair.description}</p>
                    {flair.topic && (
                      <p className="text-[10px] text-foreground/50 uppercase tracking-wider mt-1">
                        {flair.topic}
                      </p>
                    )}
                  </div>
                </div>
                {selectedFlair === flair.id && (
                  <Check className="w-5 h-5 text-foreground" />
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  )
}
