import { NextRequest, NextResponse } from 'next/server'

/**
 * Get user's following list from Neynar (people they follow)
 * Makes more sense to add people you follow to your friends list
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

    // Fetch users that this FID is following
    const neynarUrl = `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=100`
    console.log('[Followers API] Calling Neynar:', neynarUrl)

    const followingResponse = await fetch(neynarUrl, {
      headers: {
        'accept': 'application/json',
        'x-api-key': neynarApiKey
      }
    })

    console.log('[Followers API] Neynar response status:', followingResponse.status)

    if (!followingResponse.ok) {
      const errorText = await followingResponse.text()
      console.error('[Followers API] Neynar error:', errorText)
      return NextResponse.json({
        error: 'Neynar API error',
        details: errorText
      }, { status: followingResponse.status })
    }

    const data = await followingResponse.json()

    // Log to debug
    console.log('[Followers API] Neynar response keys:', Object.keys(data))
    console.log('[Followers API] Users count:', data.users?.length || 0)
    if (data.users && data.users.length > 0) {
      console.log('[Followers API] Sample user structure:', JSON.stringify(data.users[0], null, 2))
    }

    // Neynar v2 following response format: { users: [{ object: "follower", user: {...} }] }
    const following = (data.users || []).map((item: any) => {
      // Neynar structure has user nested in item.user
      const user = item.user
      if (!user) {
        console.warn('[Followers API] Item missing user:', item)
        return null
      }

      return {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url || user.pfp?.url
      }
    }).filter((u: any) => u && u.fid) // Filter out any invalid entries

    console.log('[Followers API] Parsed ${following.length} following users')
    if (following.length > 0) {
      console.log('[Followers API] Sample parsed user:', following[0])
    }

    return NextResponse.json({ followers: following })
  } catch (error) {
    console.error('[Followers API] Full error:', error)
    console.error('[Followers API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch followers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
