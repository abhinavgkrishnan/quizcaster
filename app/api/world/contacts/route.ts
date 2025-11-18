import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * POST /api/world/contacts
 * Match World App contacts with database users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contacts } = body

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Invalid contacts data' }, { status: 400 })
    }

    // Extract wallet addresses from contacts
    const walletAddresses = contacts.map((c: any) => c.walletAddress || c.wallet_address).filter(Boolean)

    if (walletAddresses.length === 0) {
      return NextResponse.json({ contacts: [] })
    }

    // Query database for users with these wallet addresses
    const { data: users, error } = await supabase
      .from('users')
      .select('fid, username, display_name, pfp_url, wallet_address, active_flair')
      .in('wallet_address', walletAddresses)

    if (error) {
      console.error('[World Contacts API] Database error:', error)
      throw error
    }

    // Map contacts to include database info
    const enrichedContacts = contacts.map((contact: any) => {
      const walletAddress = contact.walletAddress || contact.wallet_address
      const dbUser = users?.find(u => u.wallet_address === walletAddress)

      return {
        walletAddress,
        username: contact.username || dbUser?.username,
        profilePictureUrl: contact.profilePictureUrl || dbUser?.pfp_url,
        inDatabase: !!dbUser,
        fid: dbUser?.fid,
        displayName: dbUser?.display_name,
        pfpUrl: dbUser?.pfp_url,
        activeFlair: dbUser?.active_flair,
      }
    })

    // Sort: database users first
    enrichedContacts.sort((a, b) => {
      if (a.inDatabase && !b.inDatabase) return -1
      if (!a.inDatabase && b.inDatabase) return 1
      return 0
    })

    return NextResponse.json({ contacts: enrichedContacts })
  } catch (error) {
    console.error('[World Contacts API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process contacts' },
      { status: 500 }
    )
  }
}
