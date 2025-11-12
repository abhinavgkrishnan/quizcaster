"use client"

import { motion } from "framer-motion"
import { Microscope, BookOpen, Trophy, Film, Globe2, Cpu, Home, Search, User, Bell } from "lucide-react"

interface TopicSelectionProps {
  onSelectTopic: (topic: string) => void
}

const TOPICS = [
  { id: 1, name: "Science", icon: Microscope, color: "brutal-violet" },
  { id: 2, name: "History", icon: BookOpen, color: "brutal-beige" },
  { id: 3, name: "Sports", icon: Trophy, color: "brutal-violet" },
  { id: 4, name: "Movies", icon: Film, color: "brutal-beige" },
  { id: 5, name: "Geography", icon: Globe2, color: "brutal-violet" },
  { id: 6, name: "Technology", icon: Cpu, color: "brutal-beige" },
  { id: 7, name: "Music", icon: Microscope, color: "brutal-beige" },
  { id: 8, name: "Art", icon: BookOpen, color: "brutal-violet" },
  { id: 9, name: "Food", icon: Trophy, color: "brutal-beige" },
]

const MENU_ITEMS = [
  { icon: Home, label: "Home", active: true },
  { icon: Search, label: "Discover", active: false },
  { icon: Trophy, label: "Leaderboard", active: false },
  { icon: Bell, label: "Activity", active: false },
  { icon: User, label: "Profile", active: false },
]

export default function TopicSelection({ onSelectTopic }: TopicSelectionProps) {
  return (
    <div className="w-full max-w-2xl mx-auto h-screen flex flex-col bg-card">
      {/* Header */}
      <div className="flex-none px-6 pt-8 pb-6">
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
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-4">
          {TOPICS.map((topic, index) => {
            const Icon = topic.icon
            return (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.03
                }}
                whileHover={{
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                }}
                whileTap={{
                  scale: 0.97,
                  transition: { type: "spring", stiffness: 500, damping: 15 }
                }}
                onClick={() => onSelectTopic(topic.name)}
                className={`relative aspect-square rounded-2xl ${topic.color} brutal-border font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all`}
              >
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 p-3">
                  <Icon className="w-10 h-10 stroke-[2.5] text-foreground" />
                  <div className="text-xs font-bold tracking-wide text-center leading-tight uppercase text-foreground">
                    {topic.name}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
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
            return (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-all min-w-0 ${
                  item.active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${item.active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${item.active ? 'font-bold' : ''} truncate max-w-[60px] text-center`}>
                  {item.label}
                </span>
                {item.active && (
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
