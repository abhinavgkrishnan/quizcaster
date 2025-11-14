/**
 * Central Type Export Hub
 * Import all types from this single location
 */

// Game types
export type {
  PlayerData,
  Question,
  PlayerScore,
  MatchData,
  AppScreen,
  GamePhase,
  PlayerDataWithFlair,
} from './game';

// User types
export type {
  FarcasterUser,
  UserStats,
  UserWithFlair,
  UserStatsExtended,
} from './user';

// Flair types
export type {
  Flair,
  FlairResponse,
  FlairActionRequest,
} from './flair';

// Friends types
export type {
  FriendshipStatus,
  Friendship,
  Friend,
  FriendRequest,
  FriendsResponse,
  FriendRequestsResponse,
  FriendActionRequest,
} from './friends';

// Challenge types
export type {
  AsyncChallengeStatus,
  AsyncMatchStatus,
  AsyncChallenge,
  ChallengerAnswer,
  ChallengerGameData,
  ChallengesResponse,
  ChallengeCreateRequest,
  ChallengeActionRequest,
} from './challenge';

// Match types
export type {
  MatchHistoryItem,
  MatchHistoryResponse,
  TopicWithFlairs,
} from './match';

// Re-export commonly used types from other modules
export type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
export type { MatchType, MatchStatus, PlayerStatus } from '@/lib/constants';
