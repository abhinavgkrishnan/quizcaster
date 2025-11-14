/**
 * Award Flairs Script - Check and award all earned flairs for all users
 * Run this after implementing flair system to backfill earned flairs
 *
 * Usage: bun run scripts/award-flairs.ts
 */

import { supabase } from '../lib/utils/supabase'

async function awardAllFlairs() {
  console.log('🏆 Checking and awarding flairs...\n')

  // Get all topics with flairs
  const { data: topics } = await supabase
    .from('topics')
    .select('slug, flairs')
    .not('flairs', 'is', null)

  if (!topics || topics.length === 0) {
    console.log('❌ No topics with flairs found')
    return
  }

  console.log(`📚 Found ${topics.length} topics with flair systems`)

  let totalAwarded = 0

  for (const topic of topics) {
    console.log(`\n📖 Processing topic: ${topic.slug}`)

    const flairs = topic.flairs as any[]
    if (!flairs || flairs.length === 0) continue

    // Get all users who played this topic
    const { data: userStats } = await supabase
      .from('user_stats_by_topic')
      .select('fid, matches_won')
      .eq('topic', topic.slug)

    if (!userStats || userStats.length === 0) {
      console.log(`   No players for ${topic.slug}`)
      continue
    }

    for (const stat of userStats) {
      // Get user's current earned flairs
      const { data: user } = await supabase
        .from('users')
        .select('earned_flairs')
        .eq('fid', stat.fid)
        .single()

      const earnedFlairs = (user?.earned_flairs as any[]) || []
      const newFlairs: any[] = []

      // Check which flairs should be awarded
      for (const flair of flairs) {
        const alreadyEarned = earnedFlairs.some((f: any) => f.id === flair.id)
        if (!alreadyEarned && stat.matches_won >= flair.requirement.count) {
          newFlairs.push({
            ...flair,
            topic: topic.slug,
            earned_at: new Date().toISOString()
          })
        }
      }

      if (newFlairs.length > 0) {
        const updatedFlairs = [...earnedFlairs, ...newFlairs]
        await supabase
          .from('users')
          .update({ earned_flairs: updatedFlairs })
          .eq('fid', stat.fid)

        console.log(`   ✅ FID ${stat.fid} (${stat.matches_won} wins): Awarded ${newFlairs.map(f => f.name).join(', ')}`)
        totalAwarded += newFlairs.length
      } else {
        console.log(`   ℹ️  FID ${stat.fid} (${stat.matches_won} wins): No new flairs`)
      }
    }
  }

  console.log(`\n✨ Complete! Awarded ${totalAwarded} total flairs`)
}

awardAllFlairs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
