/**
 * Get Match Details API
 * Retrieves match data with questions for a specific match
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/utils/supabase';
import { getGameState } from '@/lib/redis/game-state';
import { shuffleArray } from '@/lib/utils/shuffle';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;

    // First check Redis for active game
    const gameState = await getGameState(matchId);

    if (gameState) {
      // Active game in Redis - also fetch Postgres data for completion status
      const { data: match } = await supabase
        .from('matches')
        .select(`
          *,
          player1:users!matches_player1_fid_users_fid_fk(username, display_name),
          player2:users!matches_player2_fid_users_fid_fk(username, display_name)
        `)
        .eq('id', matchId)
        .single();

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, question, options, image_url')
        .in('id', gameState.questions);


      if (!questionsData) {
        return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
      }

      // CRITICAL: Preserve question order from gameState.questions array
      const orderedQuestions = gameState.questions
        .map(questionId => questionsData.find(q => q.id === questionId))
        .filter((q): q is NonNullable<typeof q> => q !== undefined);


      // Parse and shuffle options
      const parseOptions = (options: unknown): string[] => {
        if (Array.isArray(options)) {
          return options.filter((opt): opt is string => typeof opt === 'string');
        }
        return [];
      };

      const formattedQuestions = orderedQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        options: shuffleArray(parseOptions(q.options)),
        imageUrl: q.image_url,
      }));


      return NextResponse.json({
        match_id: matchId,
        status: gameState.status,
        player1_fid: gameState.player1_fid,
        player2_fid: gameState.player2_fid,
        player1_score: gameState.player1_score,
        player2_score: gameState.player2_score,
        current_question: gameState.current_question,
        questions: formattedQuestions,
        player1_completed_at: match?.player1_completed_at || null,
        player2_completed_at: match?.player2_completed_at || null,
        is_async: match?.is_async || false,
        match_type: match?.match_type || 'realtime',
        topic: match?.topic || 'unknown',
        challenger_data: match?.challenger_data || null,
        player1_username: match?.player1?.username,
        player1_display_name: match?.player1?.display_name,
        player2_username: match?.player2?.username,
        player2_display_name: match?.player2?.display_name,
        from_redis: true,
      });
    }

    // Not in Redis - check Postgres
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:users!matches_player1_fid_users_fid_fk(username, display_name),
        player2:users!matches_player2_fid_users_fid_fk(username, display_name)
      `)
      .eq('id', matchId)
      .single();


    if (error || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get questions from match
    const questionIds = Array.isArray(match.questions_used)
      ? match.questions_used
      : JSON.parse(match.questions_used as string);


    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, options, image_url')
      .in('id', questionIds);


    if (!questionsData) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
    }

    // CRITICAL: Preserve question order from questionIds array
    const orderedQuestions = questionIds
      .map((questionId: string) => questionsData.find((q: any) => q.id === questionId))
      .filter((q: any): q is NonNullable<typeof q> => q !== undefined);


    const parseOptions = (options: unknown): string[] => {
      if (Array.isArray(options)) {
        return options.filter((opt): opt is string => typeof opt === 'string');
      }
      return [];
    };

    const formattedQuestions = orderedQuestions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: shuffleArray(parseOptions(q.options)),
      imageUrl: q.image_url,
    }));


    return NextResponse.json({
      match_id: matchId,
      status: match.status,
      player1_fid: match.player1_fid,
      player2_fid: match.player2_fid,
      player1_username: match.player1?.username,
      player1_display_name: match.player1?.display_name,
      player2_username: match.player2?.username,
      player2_display_name: match.player2?.display_name,
      questions: formattedQuestions,
      is_async: match.is_async || false,
      match_type: match.match_type,
      topic: match.topic,
      challenger_data: match.challenger_data,
      from_redis: false,
    });
  } catch (error) {
    console.error('Error fetching match details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match details' },
      { status: 500 }
    );
  }
}
