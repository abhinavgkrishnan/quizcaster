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
      // Active game in Redis - fetch questions
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
        player1_score: gameState.player1_score,
        player2_score: gameState.player2_score,
        current_question: gameState.current_question,
        questions: formattedQuestions,
        from_redis: true,
      });
    }

    // Not in Redis - check Postgres
    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
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
      questions: formattedQuestions,
      is_async: match.is_async || false,
      match_type: match.match_type,
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
