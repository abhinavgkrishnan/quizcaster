"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import * as Icons from "lucide-react"
import { Home, Search, User, Bell, Trophy } from "lucide-react"

interface TopicSelectionProps {
  onSelectTopic: (topic: string) => void
  onNavigate: (screen: "topics" | "matchmaking" | "game" | "profile") => void
}

interface Topic {
  slug: string
  display_name: string
  icon_name: string | null
  color_class: string | null
  question_count: number
}

const MENU_ITEMS = [
  { icon: Home, label: "Home", screen: "topics" as const },
  { icon: Search, label: "Discover", screen: "topics" as const },
  { icon: Trophy, label: "Leaderboard", screen: "topics" as const },
  { icon: Bell, label: "Activity", screen: "topics" as const },
  { icon: User, label: "Profile", screen: "profile" as const },
]

export default function TopicSelection({ onSelectTopic, onNavigate }: TopicSelectionProps) {
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
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            QuizCaster
          </h1>
          <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Choose your topic</p>
        </motion.div>
      </div>

      {/* Topics Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
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
          <div className="grid grid-cols-3 gap-4 p-2">
            {topics.map((topic, index) => {
              // Get icon from lucide-react by name
              const IconComponent = topic.icon_name ? (Icons as any)[topic.icon_name] : Icons.HelpCircle
              const colorClass = topic.color_class || 'brutal-violet'

              return (
                <motion.button
                  key={topic.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.03
                  }}
                  whileHover={{
                    y: -6,
                    transition: { type: "spring", stiffness: 400, damping: 20 }
                  }}
                  whileTap={{
                    y: 0,
                    transition: { type: "spring", stiffness: 400, damping: 20 }
                  }}
                  onClick={() => onSelectTopic(topic.slug)}
                  className={`relative aspect-square rounded-2xl ${colorClass} brutal-border font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all`}
                >
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 p-3">
                    <IconComponent className="w-10 h-10 stroke-[2.5] text-foreground" />
                    <div className="text-xs font-bold tracking-wide text-center leading-tight uppercase text-foreground">
                      {topic.display_name}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation Menu */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="flex-none brutal-border bg-secondary border-t-2 border-x-0 border-b-0"
      >
        <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.screen === "topics" && item.label === "Home"
            return (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate(item.screen)}
                className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-all min-w-0 ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${isActive ? 'font-bold' : ''} truncate max-w-[60px] text-center`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-6 h-0.5 bg-foreground rounded-full" />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
