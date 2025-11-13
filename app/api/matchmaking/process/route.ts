/**
 * Matchmaking Process Worker
 * Processes matchmaking queues and creates matches
 * Called by Vercel Cron every 2 seconds
 */

import { NextRequest, NextResponse } from 'next/server';
import { findMatch } from '@/lib/redis/matchmaking';
import { createGameSession } from '@/lib/redis/game-state';
import { supabase } from '@/lib/utils/supabase';
import { shuffleArray } from '@/lib/utils/shuffle';
import { GAME_CONFIG, MATCH_TYPES, MATCH_STATUS } from '@/lib/constants';
import type { TablesInsert } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    // Get all active topics from database
    const { data: topics } = await supabase
      .from('topics')
      .select('slug')
      .eq('is_active', true);

    if (!topics) {
      return NextResponse.json({ processed: 0, matches: [] });
    }

    const matchesCreated: string[] = [];

    // Process each topic's queue
    for (const { slug: topic } of topics) {
      // Try to find a match
      const match = await findMatch(topic);

      if (!match) {
        continue; // No match found in this topic
      }

      const { player1, player2 } = match;

      // Get 10 random questions for this topic
      const { data: questionResults } = await supabase
        .from('questions')
        .select('id')
        .eq('topic', topic)
        .eq('is_active', true)
        .limit(50);

      if (!questionResults || questionResults.length < GAME_CONFIG.QUESTIONS_PER_MATCH) {
        console.error(`Not enough questions for topic: ${topic}`);
        continue;
      }

      // Randomly select questions
      const shuffledQuestions = shuffleArray(questionResults).slice(0, GAME_CONFIG.QUESTIONS_PER_MATCH);
      const questionIds = shuffledQuestions.map((q) => q.id);

      // Create match in Postgres
      const matchRecord: TablesInsert<'matches'> = {
        match_type: MATCH_TYPES.REALTIME,
        topic,
        player1_fid: player1.fid,
        player2_fid: player2.fid,
        is_bot_opponent: false,
        status: MATCH_STATUS.IN_PROGRESS,
        questions_used: questionIds,
        started_at: new Date().toISOString(),
      };

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert(matchRecord)
        .select('id')
        .single();

      if (matchError || !matchData) {
        console.error('Error creating match:', matchError);
        continue;
      }

      const matchId = matchData.id;


      // Create game session in Redis
      try {
        await createGameSession(matchId, player1.fid, player2.fid, questionIds);
      } catch (redisError) {
        console.error('[Matchmaking Processor] Failed to create Redis session:', redisError);
        // Continue anyway - match exists in DB
      }

      // Notify both players via Supabase Realtime
      const matchmakingChannel = supabase.channel(`matchmaking:${topic}`);

      try {
        await matchmakingChannel.send({
          type: 'broadcast',
          event: 'match_found',
          payload: {
            match_id: matchId,
            player1: {
              fid: player1.fid,
              username: player1.username,
              displayName: player1.displayName,
              pfpUrl: player1.pfpUrl,
            },
            player2: {
              fid: player2.fid,
              username: player2.username,
              displayName: player2.displayName,
              pfpUrl: player2.pfpUrl,
            },
            topic,
          },
        });
      } catch (broadcastError) {
        console.error('[Matchmaking Processor] Failed to broadcast:', broadcastError);
        // Continue - players will see via polling
      }

      matchesCreated.push(matchId);
    }

    return NextResponse.json({
      processed: matchesCreated.length,
      matches: matchesCreated,
    });
  } catch (error) {
    console.error('Error processing matchmaking queues:', error);
    return NextResponse.json(
      { error: 'Failed to process matchmaking' },
      { status: 500 }
    );
  }
}
