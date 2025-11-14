"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import * as Icons from "lucide-react"

interface Topic {
  slug: string
  display_name: string
  icon_name: string | null
  color_class: string | null
  question_count: number
}

interface ChallengeTopicSelectorProps {
  onSelect: (topic: string) => void
  onClose: () => void
}

export default function ChallengeTopicSelector({ onSelect, onClose }: ChallengeTopicSelectorProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics')
        const data = await response.json()
        setTopics(data.topics)
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none brutal-border bg-secondary border-x-0 border-t-0 border-b-2 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wider">Select Topic</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="brutal-border bg-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
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
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {topics.map((topic, index) => {
                const IconComponent = topic.icon_name ? (Icons as any)[topic.icon_name] : Icons.HelpCircle
                const colorClass = topic.color_class || 'brutal-violet'

                return (
                  <motion.button
                    key={topic.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(topic.slug)}
                    className={`relative aspect-square rounded-2xl ${colorClass} brutal-border font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all touch-manipulation min-h-[120px]`}
                  >
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 p-3">
                      <IconComponent className="w-10 h-10 stroke-[2.5] text-foreground" />
                      <div className="text-xs font-bold tracking-wide text-center leading-tight uppercase text-foreground">
                        {topic.display_name}
                      </div>
                      <div className="text-[10px] text-foreground/60 font-semibold">
                        {topic.question_count} questions
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
