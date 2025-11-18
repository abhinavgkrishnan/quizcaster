/**
 * User-Facing Text Constants
 * All marketable text, messages, and zingers in one place
 */

export const TEXT = {
  // Game Results
  RESULTS: {
    VICTORY: "Victory!",
    DEFEAT: "Defeat",
    DRAW: "Draw!",

    // Zingers/Subtitles
    VICTORY_SUBTITLE: "Outstanding!",
    DEFEAT_SUBTITLE: "Try again!",
    DRAW_SUBTITLE: "Evenly matched!",

    // Forfeit messages
    OPPONENT_FORFEITED: (name: string) => `${name} forfeited!`,
    YOU_FORFEITED: "You forfeited",
  },

  // Share Messages
  SHARE: {
    VICTORY: "🏆 Victory!",
    DRAW: "🤝 Draw!",
    DEFEAT: "💪 Good game!",

    CAST_TEMPLATE: (result: string, topic: string | undefined, score: string, accuracy: string, avgTime: string) =>
      `${result} Just played Quizcaster${topic ? ` in ${topic}` : ''}!\n\n📊 Score: ${score}\n✅ Accuracy: ${accuracy}%\n⚡ Avg time: ${avgTime}s\n\nThink you can beat me? 👇`,
  },

  // Invitations
  INVITE: {
    MESSAGE: (username: string) =>
      `Hey @${username}! Join me on Quizcaster - test your knowledge and compete with friends! 🎮🧠`,
  },

  // Challenge Messages
  CHALLENGE: {
    SENT: "Challenge Sent!",
    ACCEPTED: "Challenge Accepted!",
    WAITING_FOR: (name: string) => `Waiting for ${name}`,
    WAITING_FOR_OPPONENT: "Waiting for Opponent",
    IN_PROGRESS: "Challenge in Progress",
    GOING_ASYNC: "Going Async...",
    IF_NO_JOIN: "If they don't join, you'll play async",
    WAITING_TO_FINISH: "Waiting for them to finish their match...",

    // Notification text
    NOTIF_NEW_TITLE: "New Challenge! 🎮",
    NOTIF_NEW_BODY: (challengerName: string, topic: string) => `${challengerName} challenged you to ${topic}!`,
    NOTIF_COMPLETE_TITLE: "Challenge Complete! 🎉",
    NOTIF_COMPLETE_BODY: (opponentName: string) => `${opponentName} finished your challenge!`,
  },

  // Match History
  MATCH_HISTORY: {
    TITLE: "Match History",
    NO_MATCHES: "No matches found",
    NO_MORE_MATCHES: "No more matches",
    LOADING: "Loading...",
    LOADING_MATCH: "Loading match...",
    ASYNC_CHALLENGE: "Async Challenge",

    // Result labels
    VICTORY_LABEL: "VICTORY",
    DEFEAT_LABEL: "DEFEAT",
    DRAW_LABEL: "DRAW",
    FORFEIT: "FORFEIT",
    DEFEAT_FORFEIT: "DEFEAT (FORFEIT)",
    VICTORY_FORFEIT: "VICTORY (FORFEIT)",
    OPPONENT_FORFEIT: "OPPONENT FORFEIT",
  },

  // Profile
  PROFILE: {
    NO_FRIENDS: "No Friends Yet",
    ADD_FRIENDS_CTA: "Add friends to challenge them!",
    NO_REQUESTS: "No Pending Requests",
    LOADING_FRIENDS: "Loading friends...",
    FRIEND_REQUEST_SENT: "Friend request sent!",
    PEOPLE_YOU_FOLLOW: "People You Follow",
    NO_FOLLOWERS: "No followers found",
    LOADING_FOLLOWERS: "Loading followers...",
    LOADING_MORE: "Loading more...",
  },

  // Stats Labels
  STATS: {
    QUESTIONS: "Questions",
    AVG_TIME: "Avg. Time",
    ACCURACY: "Accuracy",
    MATCHES_PLAYED: "Matches Played",
    TOTAL_GAMES: "Total Games",
    PERFORMANCE: "Performance",
    WINS: "Wins",
    LOSSES: "Losses",
    WIN_RATE: "Win Rate",
    CURRENT_STREAK: "Current",
    BEST_STREAK: "Best",
    WIN_STREAK: "Win Streak",
    MOST_PLAYED_TOPICS: "Most Played Topics",
    YOUR_SCORE: "Your Score",
    OPPONENT: "Opponent",
    STATS_HEADER: "Stats",
  },

  // Buttons
  BUTTONS: {
    PLAY_AGAIN: "Play Again",
    HOME: "Home",
    CHALLENGE: "Challenge",
    ADD_FRIEND: "Add Friend",
    INVITE: "Invite",
    ACCEPT: "Accept",
    DECLINE: "Decline",
    BACK: "Back",
    CANCEL: "Cancel",
    SHARE_RESULTS: "Share Results",
    SHARING: "Sharing...",
    ADD: "Add",
    SEND: "Send",
    RETRY: "Retry",
    GO_BACK: "Go Back",
    MANAGE_FLAIR: "Manage Flair",
    MATCH_HISTORY: "Match History",
  },

  // Alerts & Errors
  ALERTS: {
    INVITE_FIRST: "This user hasn't played Quizcaster yet. Invite them first!",
    PLEASE_SIGN_IN_FRIENDS: "Please sign in to add friends",
    PLEASE_SIGN_IN_CHALLENGE: "Please sign in to send challenges",
    CANNOT_ADD_SELF: "You cannot add yourself as a friend!",
    FRIEND_REQUEST_SENT: "Friend request sent!",
    INVITATION_SENT: (username: string) => `Invitation sent to @${username}! 🎉`,
    RESULTS_SHARED: "Results shared! 🎉",
    FAILED_TO_SHARE: "Failed to share results",
    FAILED_TO_SEND_INVITE: "Failed to send invitation",
    FAILED_TO_OPEN_COMPOSER: "Failed to open composer",
    FAILED_TO_LOAD_PROFILE: "Failed to load profile. Please try again.",
    FAILED_TO_SEND_CHALLENGE: "Failed to send challenge",
    FAILED_TO_LOAD_MATCH: "Failed to load match details",
  },

  // Topic Selection
  TOPICS: {
    CHOOSE_TOPIC: "Choose Your Topic",
    SELECT_CATEGORY: "Select a category to start",
    ALL_TOPICS: "All Topics",
  },

  // Leaderboard
  LEADERBOARD: {
    TITLE: "Leaderboard",
    YOUR_RANK: "Your Rank",
    TOP_PLAYERS: "Top Players",
    RANK: "Rank",
    PLAYER: "Player",
    WINS: "Wins",
  },

  // Matchmaking
  MATCHMAKING: {
    FINDING_OPPONENT: "Finding Opponent",
    SEARCHING: "Searching for opponent...",
    MATCH_FOUND: "Match Found!",
    GET_READY: "Get ready!",
    PRO_TIPS: [
      "Pro tip: Choose the correct answer",
      "Pro tip: Think Mark! Think!",
      "Pro tip: Go play Fortnite, this one's mot for you",
      "Pro tip: Use more AI",
      "Pro tip: Books! ever heard of it?",
    ],
  },

  // Questions
  QUESTION: {
    QUESTION_OF: (current: number, total: number) => `Question ${current} of ${total}`,
    DOUBLE_POINTS: "2X Points",
  },

  // Misc
  MISC: {
    CONNECT_WITH_PLAYERS: "Connect with players",
    LOADING: "Loading...",
    ME: "ME",
  }
} as const
