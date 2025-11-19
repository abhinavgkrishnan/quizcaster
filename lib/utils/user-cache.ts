/**
 * User Data Caching & Batch Fetching Utilities
 * Reduces redundant database queries by caching user data and fetching in batches
 */

import { supabase } from './supabase'

// In-memory cache for user data
interface CachedUser {
  fid: number
  username: string
  display_name: string
  pfp_url?: string
  active_flair?: any
  cached_at: number
}

// Cache storage and config
const userCache = new Map<number, CachedUser>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Check if a cached user is still fresh
 */
function isCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_TTL_MS
}

/**
 * Get user from cache if available and fresh
 */
function getUserFromCache(fid: number): CachedUser | null {
  const cached = userCache.get(fid)
  if (!cached) return null

  if (isCacheFresh(cached.cached_at)) {
    return cached
  }

  // Cache expired, remove it
  userCache.delete(fid)
  return null
}

/**
 * Add user to cache
 */
function addUserToCache(user: any): void {
  userCache.set(user.fid, {
    fid: user.fid,
    username: user.username,
    display_name: user.display_name,
    pfp_url: user.pfp_url,
    active_flair: user.active_flair,
    cached_at: Date.now()
  })
}

/**
 * Batch fetch users by FIDs with caching
 * Checks cache first, only fetches missing/stale users from database
 *
 * @param fids - Array of FIDs to fetch
 * @returns Map of fid → user data
 */
export async function getUsersByFids(
  fids: number[]
): Promise<Map<number, any>> {
  if (fids.length === 0) {
    return new Map()
  }

  // Remove duplicates
  const uniqueFids = [...new Set(fids)]

  // Check cache first
  const result = new Map<number, any>()
  const fidsToFetch: number[] = []

  for (const fid of uniqueFids) {
    const cached = getUserFromCache(fid)
    if (cached) {
      result.set(fid, cached)
    } else {
      fidsToFetch.push(fid)
    }
  }

  // If all users were in cache, return early
  if (fidsToFetch.length === 0) {
    return result
  }

  // Fetch missing users from database
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('fid, username, display_name, pfp_url, active_flair')
      .in('fid', fidsToFetch)

    if (error) {
      console.error('[User Cache] Error fetching users:', error)
      return result
    }

    // Add fetched users to cache and result
    if (users) {
      for (const user of users) {
        addUserToCache(user)
        result.set(user.fid, user)
      }
    }

    return result
  } catch (error) {
    console.error('[User Cache] Exception fetching users:', error)
    return result
  }
}

/**
 * Get a single user by FID (uses cache)
 * @param fid - FID of the user
 * @returns User data or null
 */
export async function getUserByFid(fid: number): Promise<any | null> {
  // Check cache first
  const cached = getUserFromCache(fid)
  if (cached) return cached

  // Fetch from database
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('fid, username, display_name, pfp_url, active_flair')
      .eq('fid', fid)
      .single()

    if (error || !user) {
      console.error('[User Cache] Error fetching single user:', error)
      return null
    }

    addUserToCache(user)
    return user
  } catch (error) {
    console.error('[User Cache] Exception fetching single user:', error)
    return null
  }
}

/**
 * Enrich matches with user data
 * Takes an array of matches and adds full user objects for players
 *
 * @param matches - Array of matches from database
 * @returns Matches enriched with user data
 */
export async function enrichMatchesWithUsers(matches: any[]): Promise<any[]> {
  if (matches.length === 0) return matches

  // Collect all unique FIDs from matches
  const allFids = new Set<number>()
  matches.forEach((match: any) => {
    if (match.player1_fid) allFids.add(match.player1_fid)
    if (match.player2_fid) allFids.add(match.player2_fid)
    if (match.winner_fid) allFids.add(match.winner_fid)
    if (match.forfeited_by) allFids.add(match.forfeited_by)
  })

  // Batch fetch all users
  const userMap = await getUsersByFids(Array.from(allFids))

  // Enrich matches with user data
  return matches.map(match => ({
    ...match,
    player1: userMap.get(match.player1_fid) || null,
    player2: userMap.get(match.player2_fid) || null,
  }))
}

/**
 * Enrich challenges with user data
 * Similar to enrichMatchesWithUsers but for challenges
 *
 * @param challenges - Array of challenges from database
 * @returns Challenges enriched with user data
 */
export async function enrichChallengesWithUsers(challenges: any[]): Promise<any[]> {
  if (challenges.length === 0) return challenges

  // Collect all unique FIDs
  const allFids = new Set<number>()
  challenges.forEach((challenge: any) => {
    if (challenge.challenger_fid) allFids.add(challenge.challenger_fid)
    if (challenge.challenged_fid) allFids.add(challenge.challenged_fid)
  })

  // Batch fetch all users
  const userMap = await getUsersByFids(Array.from(allFids))

  // Enrich challenges with user data
  return challenges.map(challenge => ({
    ...challenge,
    challenger: userMap.get(challenge.challenger_fid) || null,
    challenged: userMap.get(challenge.challenged_fid) || null,
  }))
}

/**
 * Clear the entire user cache
 * Useful for testing or when data consistency is critical
 */
export function clearUserCache(): void {
  userCache.clear()
}

/**
 * Clear a specific user from cache
 * Useful when user data is updated and we want to force a fresh fetch
 *
 * @param fid - FID of the user to remove from cache
 */
export function clearUserFromCache(fid: number): void {
  userCache.delete(fid)
}

/**
 * Get cache stats for monitoring
 * @returns Object with cache size and hit rate info
 */
export function getCacheStats() {
  return {
    size: userCache.size,
    entries: Array.from(userCache.keys()),
  }
}

/**
 * Warm up cache by pre-fetching commonly accessed users
 * Useful for leaderboards or frequently viewed profiles
 *
 * @param fids - Array of FIDs to pre-fetch
 */
export async function warmUpCache(fids: number[]): Promise<void> {
  await getUsersByFids(fids)
}
