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
    const followingResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=100`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': neynarApiKey
        }
      }
    )

    if (!followingResponse.ok) {
      const errorText = await followingResponse.text()
      console.error('Neynar API error:', errorText)
      throw new Error('Failed to fetch following from Neynar')
    }

    const data = await followingResponse.json()

    // Log to debug
    if (data.users && data.users.length > 0) {
      console.log('Sample user structure:', JSON.stringify(data.users[0], null, 2))
    }

    // Neynar v2 following response format: items have nested 'user' object
    const following = (data.users || []).map((item: any) => {
      // Neynar wraps the user data in item.user
      const user = item.user
      if (!user) return null

      return {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url || user.pfp?.url
      }
    }).filter((u: any) => u && u.fid) // Filter out any invalid entries

    console.log(`Parsed ${following.length} following users`)

    return NextResponse.json({ followers: following })
  } catch (error) {
    console.error('Error fetching followers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    )
  }
}
