import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { shuffleArray } from '@/lib/utils/shuffle'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  try {
    const { topic } = await params
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')

    // Get 10 random questions for this topic
    // Exclude questions from user's recent matches if fid provided
    let excludeQuestionIds: string[] = []

    // Get 10 random questions for this topic
    const { data: questionResults, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, options, image_url')
      .eq('topic', topic)
      .eq('is_active', true)
      .limit(50) // Get more to randomize

    if (questionsError || !questionResults || questionResults.length < 10) {
      return NextResponse.json(
        { error: `Not enough questions for topic: ${topic}` },
        { status: 404 }
      )
    }

    // Randomly select 10 and shuffle options
    const randomQuestions = shuffleArray(questionResults).slice(0, 10)

    return NextResponse.json({
      questions: randomQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: shuffleArray(q.options as string[]),
        imageUrl: q.image_url
      })),
      count: randomQuestions.length
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}
