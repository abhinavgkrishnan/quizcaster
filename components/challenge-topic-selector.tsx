"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import * as Icons from "lucide-react"
import { getTopicColorClass } from "@/lib/utils/topic-colors"

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
      className="fixed inset-0 z-[200] bg-black/50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full bg-card overflow-hidden max-h-[65vh] flex flex-col border-t-2 border-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none bg-secondary border-b-2 border-black px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider">Select Topic</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="brutal-border bg-background p-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
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
            <div className="grid grid-cols-3 gap-2">
              {topics.map((topic, index) => {
                const IconComponent = topic.icon_name ? (Icons as any)[topic.icon_name] : Icons.HelpCircle
                const colorClass = getTopicColorClass(topic.color_class)

                return (
                  <motion.button
                    key={topic.slug}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(topic.slug)}
                    className={`relative rounded-xl ${colorClass} brutal-border font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-shadow touch-manipulation py-3 px-2`}
                  >
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                      <IconComponent className="w-6 h-6 stroke-[2.5] text-foreground" />
                      <div className="text-[10px] font-bold tracking-wide text-center leading-tight uppercase text-foreground">
                        {topic.display_name}
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
