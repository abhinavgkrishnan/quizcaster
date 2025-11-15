import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * Get user data by FID using Neynar
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await params
    const fidNumber = parseInt(fid)

    if (isNaN(fidNumber)) {
      console.error('[User API] Invalid FID:', fid)
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY
    if (!neynarApiKey) {
      console.error('[User API] Neynar API key not configured')
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 })
    }

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidNumber}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': neynarApiKey
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[User API] Neynar error:', errorText)
      return NextResponse.json({
        error: 'Neynar API error',
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()
    const user = data.users?.[0]

    if (!user) {
      console.error('[User API] User not found:', fidNumber)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user exists in our database
    const { data: dbUser } = await supabase
      .from('users')
      .select('fid')
      .eq('fid', fidNumber)
      .single()

    const inDatabase = !!dbUser

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url,
      follower_count: user.follower_count,
      following_count: user.following_count,
      in_database: inDatabase
    })
  } catch (error) {
    console.error('[User API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
