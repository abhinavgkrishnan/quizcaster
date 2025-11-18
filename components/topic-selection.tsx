"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import * as Icons from "lucide-react"
import { Home, Users, User, Bell, Trophy } from "lucide-react"
import type { AppScreen, UnifiedUser } from "@/lib/types"
import FriendsList from "./friends-list"

interface TopicSelectionProps {
  onSelectTopic: (topic: string) => void
  onNavigate: (screen: AppScreen) => void
  user?: UnifiedUser | null
}

interface Topic {
  slug: string
  display_name: string
  icon_name: string | null
  color_class: string | null
  question_count: number
}

// MENU_ITEMS removed - using global BottomNav from layout

export default function TopicSelection({ onSelectTopic, onNavigate, user }: TopicSelectionProps) {
  const router = useRouter()
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
    <div className="w-full h-screen flex flex-col bg-card overflow-hidden">
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
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
              const bgColor = topic.color_class ? `#${topic.color_class.replace('#', '')}` : '#CFB8FF' // Ensure # prefix

              return (
                <button
                  key={topic.slug}
                  style={{
                    opacity: 0,
                    transform: 'translate3d(0, 10px, 0)',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s forwards`,
                    backgroundColor: bgColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate3d(0, -6px, 0)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'translate3d(0, -4px, 0)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
                  }}
                  onClick={() => router.push(`/topics/${topic.slug}`)}
                  className="relative aspect-square rounded-2xl brutal-border font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                >
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 p-3">
                    <IconComponent className="w-10 h-10 stroke-[2.5] text-foreground" />
                    <div className="text-xs font-bold tracking-wide text-center leading-tight uppercase text-foreground">
                      {topic.display_name}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom nav removed - now in global layout */}
    </div>
  )
}
