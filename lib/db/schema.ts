import { pgTable, bigint, text, boolean, timestamp, uuid, integer, jsonb, decimal, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================================
// USERS TABLE
// ============================================================================
export const users = pgTable('users', {
  fid: bigint('fid', { mode: 'number' }).primaryKey(),
  username: text('username').notNull(),
  displayName: text('display_name').notNull(),
  pfpUrl: text('pfp_url'),

  // Farcaster notifications
  notificationToken: text('notification_token'),
  notificationUrl: text('notification_url'),
  notificationsEnabled: boolean('notifications_enabled').default(true),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastActive: timestamp('last_active', { withTimezone: true }).defaultNow().notNull()
})

// ============================================================================
// TOPICS TABLE
// ============================================================================
export const topics = pgTable('topics', {
  slug: text('slug').primaryKey(),
  displayName: text('display_name').notNull(),
  iconName: text('icon_name'),
  colorClass: text('color_class'),
  description: text('description'),

  questionCount: integer('question_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

// ============================================================================
// QUESTIONS TABLE
// ============================================================================
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic: text('topic').notNull(),
  question: text('question').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correctAnswer: text('correct_answer').notNull(),
  imageUrl: text('image_url'),
  difficulty: text('difficulty'),

  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

// ============================================================================
// MATCHES TABLE
// ============================================================================
export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Match configuration
  matchType: text('match_type').notNull(), // 'realtime' or 'async'
  topic: text('topic').notNull(),

  // Players
  player1Fid: bigint('player1_fid', { mode: 'number' }).notNull().references(() => users.fid),
  player2Fid: bigint('player2_fid', { mode: 'number' }).references(() => users.fid),
  isBotOpponent: boolean('is_bot_opponent').default(false).notNull(),

  // Scores
  player1Score: integer('player1_score').default(0).notNull(),
  player2Score: integer('player2_score').default(0).notNull(),
  winnerFid: bigint('winner_fid', { mode: 'number' }),

  // Match data
  status: text('status').notNull(), // 'waiting', 'in_progress', 'completed', 'expired'
  questionsUsed: jsonb('questions_used').$type<string[]>().notNull(), // array of question UUIDs

  // Async-specific
  player1CompletedAt: timestamp('player1_completed_at', { withTimezone: true }),
  player2CompletedAt: timestamp('player2_completed_at', { withTimezone: true }),
  challengeMessage: text('challenge_message'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true })
})

// ============================================================================
// MATCH ANSWERS TABLE
// ============================================================================
export const matchAnswers = pgTable('match_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  fid: bigint('fid', { mode: 'number' }).notNull().references(() => users.fid),
  questionId: uuid('question_id').notNull().references(() => questions.id),
  questionNumber: integer('question_number').notNull(), // 1-10

  // Answer data
  answerGiven: text('answer_given').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  timeTakenMs: integer('time_taken_ms').notNull(),
  pointsEarned: integer('points_earned').notNull(),

  answeredAt: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqueAnswer: unique().on(table.matchId, table.fid, table.questionNumber)
}))

// ============================================================================
// USER STATS BY TOPIC
// ============================================================================
export const userStatsByTopic = pgTable('user_stats_by_topic', {
  fid: bigint('fid', { mode: 'number' }).notNull().references(() => users.fid, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),

  // Match stats
  matchesPlayed: integer('matches_played').default(0).notNull(),
  matchesWon: integer('matches_won').default(0).notNull(),
  matchesLost: integer('matches_lost').default(0).notNull(),
  matchesDrawn: integer('matches_drawn').default(0).notNull(),

  // Performance
  totalPoints: integer('total_points').default(0).notNull(),
  questionsAnswered: integer('questions_answered').default(0).notNull(),
  questionsCorrect: integer('questions_correct').default(0).notNull(),
  avgResponseTimeMs: integer('avg_response_time_ms'),
  bestStreak: integer('best_streak').default(0).notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  pk: { columns: [table.fid, table.topic] }
}))

// ============================================================================
// USER STATS OVERALL
// ============================================================================
export const userStatsOverall = pgTable('user_stats_overall', {
  fid: bigint('fid', { mode: 'number' }).primaryKey().references(() => users.fid, { onDelete: 'cascade' }),

  // Match totals
  totalMatches: integer('total_matches').default(0).notNull(),
  totalWins: integer('total_wins').default(0).notNull(),
  totalLosses: integer('total_losses').default(0).notNull(),
  totalDraws: integer('total_draws').default(0).notNull(),

  // Performance totals
  totalPoints: integer('total_points').default(0).notNull(),
  totalQuestions: integer('total_questions').default(0).notNull(),
  totalCorrect: integer('total_correct').default(0).notNull(),
  avgResponseTimeMs: integer('avg_response_time_ms'),
  longestStreak: integer('longest_streak').default(0).notNull(),

  // Rankings
  globalRank: integer('global_rank'),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

// ============================================================================
// MATCHMAKING QUEUE
// ============================================================================
export const matchmakingQueue = pgTable('matchmaking_queue', {
  fid: bigint('fid', { mode: 'number' }).primaryKey().references(() => users.fid, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  skillLevel: integer('skill_level').default(1000).notNull(),

  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  status: text('status').default('waiting').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
})

// ============================================================================
// ASYNC CHALLENGES
// ============================================================================
export const asyncChallenges = pgTable('async_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),

  challengerFid: bigint('challenger_fid', { mode: 'number' }).notNull().references(() => users.fid),
  challengedFid: bigint('challenged_fid', { mode: 'number' }).references(() => users.fid),
  topic: text('topic').notNull(),

  status: text('status').default('pending').notNull(),
  challengeMessage: text('challenge_message'),
  shareUrl: text('share_url'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true })
})

// ============================================================================
// LEADERBOARDS
// ============================================================================
export const leaderboards = pgTable('leaderboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  fid: bigint('fid', { mode: 'number' }).notNull().references(() => users.fid),
  rank: integer('rank').notNull(),

  leaderboardType: text('leaderboard_type').notNull(),
  periodStart: timestamp('period_start', { mode: 'date' }),
  periodEnd: timestamp('period_end', { mode: 'date' }),

  // Cached stats
  totalPoints: integer('total_points').notNull(),
  totalWins: integer('total_wins').notNull(),
  matchesPlayed: integer('matches_played').notNull(),
  winRate: decimal('win_rate', { precision: 5, scale: 2 }),

  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqueLeaderboard: unique().on(table.fid, table.leaderboardType, table.periodStart)
}))

// ============================================================================
// TYPES (for TypeScript inference)
// ============================================================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert

export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert

export type MatchAnswer = typeof matchAnswers.$inferSelect
export type NewMatchAnswer = typeof matchAnswers.$inferInsert

export type UserStatsByTopic = typeof userStatsByTopic.$inferSelect
export type UserStatsOverall = typeof userStatsOverall.$inferSelect

export type AsyncChallenge = typeof asyncChallenges.$inferSelect
export type NewAsyncChallenge = typeof asyncChallenges.$inferInsert

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
