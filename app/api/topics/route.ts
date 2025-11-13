import { NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'
import type { Tables } from '@/lib/database.types'

type Topic = Tables<'topics'>

interface TopicResponse {
  slug: string
  display_name: string
  icon_name: string | null
  color_class: string | null
  description: string | null
  question_count: number
}

export async function GET() {
  try {
    const { data: activeTopics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      console.error('Error fetching topics:', error)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    const topics: TopicResponse[] = (activeTopics || []).map((t) => ({
      slug: t.slug,
      display_name: t.display_name,
      icon_name: t.icon_name,
      color_class: t.color_class,
      description: t.description,
      question_count: t.question_count
    }))

    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}
