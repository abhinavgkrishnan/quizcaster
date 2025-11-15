import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/cast/compose
 * Return cast composer data for the Farcaster SDK
 * The actual publishing will be done client-side via sdk.actions.openUrl()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, embeds } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Return the composer payload
    // Client will use sdk.actions.openUrl() to open Warpcast composer
    return NextResponse.json({
      success: true,
      composerData: {
        text,
        embeds: embeds || []
      }
    })
  } catch (error) {
    console.error('[Cast Compose API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to prepare cast',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
