/**
 * Backfill Script: Recalculate avg_response_time_ms for all users
 * Run this to fix the 0.0s avg time issue
 *
 * Usage: bun run scripts/backfill-avg-time.ts
 */

import { supabase } from '../lib/utils/supabase'

async function backfillAvgResponseTime() {
  console.log('🔄 Starting avg_response_time backfill...')

  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('fid')

  if (!users || users.length === 0) {
    console.log('❌ No users found')
    return
  }

  console.log(`📊 Found ${users.length} users to process`)

  let updated = 0
  let skipped = 0

  for (const user of users) {
    try {
      // Calculate avg response time from match_answers (exclude timeouts)
      const { data: answers } = await supabase
        .from('match_answers')
        .select('time_taken_ms')
        .eq('fid', user.fid)
        .neq('answer_given', 'TIMEOUT')

      if (!answers || answers.length === 0) {
        skipped++
        continue
      }

      const avgTime = Math.round(
        answers.reduce((sum, a) => sum + a.time_taken_ms, 0) / answers.length
      )

      // Update user_stats_overall
      await supabase
        .from('user_stats_overall')
        .update({ avg_response_time_ms: avgTime })
        .eq('fid', user.fid)

      // Update user_stats_by_topic for each topic
      const { data: topics } = await supabase
        .from('user_stats_by_topic')
        .select('topic')
        .eq('fid', user.fid)

      if (topics) {
        for (const topicRow of topics) {
          const { data: topicAnswers } = await supabase
            .from('match_answers')
            .select('time_taken_ms, match_id')
            .eq('fid', user.fid)
            .neq('answer_given', 'TIMEOUT')

          // Filter by topic (need to join with matches)
          const { data: topicMatches } = await supabase
            .from('matches')
            .select('id')
            .eq('topic', topicRow.topic)
            .or(`player1_fid.eq.${user.fid},player2_fid.eq.${user.fid}`)

          const matchIds = new Set(topicMatches?.map(m => m.id) || [])
          const topicAnswersFiltered = topicAnswers?.filter(a => matchIds.has(a.match_id)) || []

          if (topicAnswersFiltered.length > 0) {
            const topicAvgTime = Math.round(
              topicAnswersFiltered.reduce((sum, a) => sum + a.time_taken_ms, 0) / topicAnswersFiltered.length
            )

            await supabase
              .from('user_stats_by_topic')
              .update({ avg_response_time_ms: topicAvgTime })
              .eq('fid', user.fid)
              .eq('topic', topicRow.topic)
          }
        }
      }

      updated++
      console.log(`✅ Updated FID ${user.fid}: ${avgTime}ms avg`)
    } catch (error) {
      console.error(`❌ Error processing FID ${user.fid}:`, error)
    }
  }

  console.log(`\n✨ Backfill complete!`)
  console.log(`   Updated: ${updated} users`)
  console.log(`   Skipped: ${skipped} users (no answers)`)
}

backfillAvgResponseTime()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
