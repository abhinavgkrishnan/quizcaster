"use client"

import { motion } from "framer-motion"

interface TopicSelectionProps {
  onSelectTopic: (topic: string) => void
}

const TOPICS = [
  { id: 1, name: "Science", emoji: "🔬", color: "from-purple-500 to-purple-600" },
  { id: 2, name: "History", emoji: "📚", color: "from-indigo-500 to-indigo-600" },
  { id: 3, name: "Sports", emoji: "⚽", color: "from-purple-600 to-pink-600" },
  { id: 4, name: "Movies", emoji: "🎬", color: "from-indigo-600 to-purple-600" },
  { id: 5, name: "Geography", emoji: "🌍", color: "from-purple-500 to-indigo-600" },
  { id: 6, name: "Technology", emoji: "💻", color: "from-indigo-500 to-purple-600" },
]

export default function TopicSelection({ onSelectTopic }: TopicSelectionProps) {
  return (
    <div className="w-full max-w-md px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-primary mb-2">QuizUp</h1>
        <p className="text-muted-foreground text-sm">Select a topic to get started</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {TOPICS.map((topic, index) => (
          <motion.button
            key={topic.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectTopic(topic.name)}
            className={`p-6 rounded-2xl bg-gradient-to-br ${topic.color} text-white font-semibold shadow-lg hover:shadow-xl transition-all relative overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-all" />
            <div className="relative z-10">
              <div className="text-4xl mb-2">{topic.emoji}</div>
              <div className="text-sm">{topic.name}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-12 p-4 bg-card rounded-xl border border-border">
        <p className="text-xs text-muted-foreground text-center">
          Play against opponents worldwide. Answer questions fast to earn more points!
        </p>
      </div>
    </div>
  )
}
