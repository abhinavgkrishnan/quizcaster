import { NextRequest, NextResponse } from 'next/server'

/**
 * Get user data by FID using Neynar
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await params
    console.log('[User API] Fetching user FID:', fid)

    const fidNumber = parseInt(fid)

    if (isNaN(fidNumber)) {
      console.error('[User API] Invalid FID:', fid)
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    // Fetch from Neynar
    const neynarApiKey = process.env.NEYNAR_API_KEY
    if (!neynarApiKey) {
      console.error('[User API] Neynar API key not configured')
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 })
    }

    const neynarUrl = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidNumber}`
    console.log('[User API] Calling Neynar:', neynarUrl)

    const response = await fetch(neynarUrl, {
      headers: {
        'accept': 'application/json',
        'x-api-key': neynarApiKey
      }
    })

    console.log('[User API] Neynar response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[User API] Neynar error response:', errorText)
      return NextResponse.json({
        error: 'Neynar API error',
        details: errorText,
        status: response.status
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('[User API] Neynar data:', JSON.stringify(data, null, 2))

    const user = data.users?.[0]

    if (!user) {
      console.error('[User API] No user in response:', data)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[User API] Returning user:', {
      fid: user.fid,
      username: user.username,
      display_name: user.display_name
    })

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url,
      follower_count: user.follower_count,
      following_count: user.following_count
    })
  } catch (error) {
    console.error('[User API] Full error:', error)
    console.error('[User API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
