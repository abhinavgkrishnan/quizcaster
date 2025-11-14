import { NextRequest, NextResponse } from 'next/server'

/**
 * Get user's followers from Neynar
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY
    if (!neynarApiKey) {
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 })
    }

    // Fetch followers from Neynar
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/followers?fid=${fid}&limit=100`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch followers from Neynar')
    }

    const data = await response.json()

    // Format followers
    const followers = (data.users || []).map((user: any) => ({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url
    }))

    return NextResponse.json({ followers })
  } catch (error) {
    console.error('Error fetching followers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    )
  }
}
