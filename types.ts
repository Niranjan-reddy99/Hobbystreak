
export enum ViewState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ONBOARDING = 'ONBOARDING',
  TUTORIAL = 'TUTORIAL',
  FEED = 'FEED',
  EXPLORE = 'EXPLORE',
  SCHEDULE = 'SCHEDULE',
  CHALLENGES = 'CHALLENGES',
  PROFILE = 'PROFILE',
  CREATE_POST = 'CREATE_POST',
  CREATE_HOBBY = 'CREATE_HOBBY',
  VIEW_USER_PROFILE = 'VIEW_USER_PROFILE',
  MESSAGES_LIST = 'MESSAGES_LIST',
  DM_CHAT = 'DM_CHAT',
  COMMUNITY_DETAILS = 'COMMUNITY_DETAILS',
  SETTINGS = 'SETTINGS'
}

export enum HobbyCategory {
  FITNESS = 'Fitness',
  CREATIVE = 'Creative',
  INTELLECTUAL = 'Intellectual',
  OUTDOORS = 'Outdoors',
  TECH = 'Tech'
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

export interface UserStats {
  streak: number;
  lastLogDate: string | null; // ISO Date string
  totalLogs: number;
  totalPoints: number;
}

export interface DailyChallenge {
  id: string;
  text: string;
  category: HobbyCategory;
  points: number;
  completed: boolean;
  date: string; // ISO Date string (day only)
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  joinedHobbies: string[]; // List of Hobby IDs
  hobbyStreaks: Record<string, number>; // Map of Hobby ID to Streak Count
  privacySettings: {
    profileVisibility: 'public' | 'private';
  };
  following: string[];
  followers: string[];
  stats: UserStats;
  unlockedAchievements: string[]; // List of Achievement IDs
  dailyChallenges: DailyChallenge[];
}

export interface Hobby {
  id: string;
  name: string;
  description: string;
  category: HobbyCategory;
  memberCount: number;
  image: string;
  icon: string;
  rules?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  hobbyId: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: Comment[];
  timestamp: string; // ISO string
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}
export interface Reminder {
  id: string;
  text: string;
  date: Date;
  completed: boolean;
}