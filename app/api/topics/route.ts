import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

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

    return NextResponse.json({
      topics: (activeTopics || []).map((t: any) => ({
        slug: t.slug,
        display_name: t.display_name,
        icon_name: t.icon_name,
        color_class: t.color_class,
        description: t.description,
        question_count: t.question_count
      }))
    })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}
