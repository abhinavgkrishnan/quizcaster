/**
 * Friends/Followers System Types
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export interface Friendship {
  id: string
  requester_fid: number
  addressee_fid: number
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface Friend {
  fid: number
  username: string
  display_name: string
  pfp_url?: string
  active_flair?: any
}

export interface FriendRequest {
  id: string
  requester_fid: number
  created_at: string
  requester: Friend
}

export interface FriendsResponse {
  friends: Friend[]
}

export interface FriendRequestsResponse {
  requests: FriendRequest[]
}

export interface FriendActionRequest {
  action: 'send_request' | 'accept' | 'decline'
  requester_fid?: number
  addressee_fid?: number
  friendship_id?: string
}
