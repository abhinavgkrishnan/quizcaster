#!/usr/bin/env bun
/**
 * Backfill Streaks Script
 * Recalculates longest_streak and best_streak for all existing users
 * Run: bun scripts/backfill-streaks.ts
 */

import { supabase } from '../lib/utils/supabase';

async function backfillStreaks() {
  console.log('🔄 Starting streak backfill...\n');

  // Get all users who have played matches
  const { data: users, error: usersError } = await supabase
    .from('user_stats_overall')
    .select('fid')
    .gte('total_matches', 1);

  if (usersError || !users) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log(`📊 Found ${users.length} users to process\n`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const fid = user.fid;

    // Get all completed matches for this player
    const { data: matches } = await supabase
      .from('matches')
      .select('winner_fid, player1_fid, player2_fid, completed_at, topic')
      .or(`player1_fid.eq.${fid},player2_fid.eq.${fid}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (!matches || matches.length === 0) {
      skipped++;
      continue;
    }

    // Calculate longest overall streak
    let longestOverallStreak = 0;
    let currentOverallStreak = 0;

    for (const match of matches) {
      if (match.winner_fid === fid) {
        currentOverallStreak++;
        longestOverallStreak = Math.max(longestOverallStreak, currentOverallStreak);
      } else {
        currentOverallStreak = 0;
      }
    }

    // Calculate best streak per topic
    const topicStreaks: Record<string, number> = {};
    const topicCurrentStreaks: Record<string, number> = {};

    for (const match of matches) {
      const topic = match.topic;
      if (!topicStreaks[topic]) {
        topicStreaks[topic] = 0;
        topicCurrentStreaks[topic] = 0;
      }

      if (match.winner_fid === fid) {
        topicCurrentStreaks[topic]++;
        topicStreaks[topic] = Math.max(topicStreaks[topic], topicCurrentStreaks[topic]);
      } else {
        topicCurrentStreaks[topic] = 0;
      }
    }

    // Update user_stats_overall
    await supabase
      .from('user_stats_overall')
      .update({ longest_streak: longestOverallStreak })
      .eq('fid', fid);

    // Update user_stats_by_topic for each topic
    for (const [topic, bestStreak] of Object.entries(topicStreaks)) {
      await supabase
        .from('user_stats_by_topic')
        .update({ best_streak: bestStreak })
        .eq('fid', fid)
        .eq('topic', topic);
    }

    console.log(`✅ FID ${fid}: Overall=${longestOverallStreak}, Topics=${JSON.stringify(topicStreaks)}`);
    updated++;
  }

  console.log(`\n✨ Backfill complete!`);
  console.log(`   Updated: ${updated} users`);
  console.log(`   Skipped: ${skipped} users (no matches)`);

  process.exit(0);
}

backfillStreaks().catch(error => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});
