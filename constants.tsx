
import { Hobby, HobbyCategory, Post, User, Conversation, DirectMessage, Achievement, DailyChallenge, Reminder } from './types';

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a1',
    name: 'First Step',
    description: 'Log your first activity.',
    icon: '🦶',
    points: 50
  },
  {
    id: 'a2',
    name: 'On Fire',
    description: 'Reach a 3-day streak.',
    icon: '🔥',
    points: 100
  },
  {
    id: 'a3',
    name: 'Dedicated',
    description: 'Reach a 7-day streak.',
    icon: '🏆',
    points: 500
  },
  {
    id: 'a4',
    name: 'Social Butterfly',
    description: 'Follow 3 people.',
    icon: '🦋',
    points: 150
  },
  {
    id: 'a5',
    name: 'Collector',
    description: 'Join 3 different hobby communities.',
    icon: '🎒',
    points: 200
  }
];

// Curated challenges to replace AI generation (Cost Optimization)
export const CHALLENGE_REPOSITORY: Record<HobbyCategory, string[]> = {
  [HobbyCategory.FITNESS]: [
    "Do 20 pushups immediately.",
    "Take a 15-minute brisk walk.",
    "Stretch for 10 minutes.",
    "Drink 1 liter of water before noon.",
    "Hold a plank for 60 seconds."
  ],
  [HobbyCategory.CREATIVE]: [
    "Sketch something in the room in 5 minutes.",
    "Write a haiku about your day.",
    "Take a photo of a unique shadow.",
    "Doodle on a sticky note.",
    "Listen to a song from a genre you dislike."
  ],
  [HobbyCategory.INTELLECTUAL]: [
    "Read 5 pages of a book.",
    "Learn one new word and use it today.",
    "Watch an educational video (TED Talk, etc).",
    "Solve a sudoku or crossword.",
    "Write down 3 things you learned today."
  ],
  [HobbyCategory.TECH]: [
    "Read a tech news article.",
    "Clean up your desktop/downloads folder.",
    "Write 10 lines of code.",
    "Learn a new keyboard shortcut.",
    "Update one software or package."
  ],
  [HobbyCategory.OUTDOORS]: [
    "Stand barefoot on grass for 5 mins.",
    "Identify a local bird or plant.",
    "Find a new walking path.",
    "Sit outside for 10 mins without phone.",
    "Pick up one piece of litter."
  ]
};

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Builder',
  avatar: 'https://picsum.photos/150/150',
  bio: 'Exploring new skills one day at a time.',
  joinedHobbies: ['h1', 'h3'],
  hobbyStreaks: {
    'h1': 5,
    'h3': 12
  },
  privacySettings: {
    profileVisibility: 'public'
  },
  following: ['u2'],
  followers: ['u3'],
  stats: {
    streak: 2,
    lastLogDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    totalLogs: 12,
    totalPoints: 350
  },
  unlockedAchievements: ['a1', 'a5'],
  dailyChallenges: []
};

export const MOCK_HOBBIES: Hobby[] = [
  {
    id: 'h1',
    name: 'Morning Runners',
    description: 'A community for early birds who love to run.',
    category: HobbyCategory.FITNESS,
    memberCount: 1240,
    image: 'https://picsum.photos/800/400?random=1',
    icon: '🏃',
    rules: [
        'Respect everyone\'s pace.',
        'Post only running related content.',
        'Encourage others, no negativity.'
    ]
  },
  {
    id: 'h2',
    name: 'Sketch Daily',
    description: 'Commit to one sketch every single day.',
    category: HobbyCategory.CREATIVE,
    memberCount: 850,
    image: 'https://picsum.photos/800/400?random=2',
    icon: '✏️',
    rules: [
        'Post one sketch per day.',
        'Constructive criticism only.',
        'No AI generated art.'
    ]
  },
  {
    id: 'h3',
    name: 'Book Club 2024',
    description: 'Reading classics and modern hits together.',
    category: HobbyCategory.INTELLECTUAL,
    memberCount: 3200,
    image: 'https://picsum.photos/800/400?random=3',
    icon: '📚',
    rules: [
        'No spoilers without warning tags.',
        'Be respectful of different interpretations.',
        'Stay on topic for the monthly book.'
    ]
  },
  {
    id: 'h4',
    name: 'React Learners',
    description: 'Building cool things with JS and TS.',
    category: HobbyCategory.TECH,
    memberCount: 5400,
    image: 'https://picsum.photos/800/400?random=4',
    icon: '💻',
    rules: [
        'Share code snippets via links.',
        'Help beginners patiently.',
        'No job postings.'
    ]
  },
  {
    id: 'h5',
    name: 'Weekend Hikers',
    description: 'Exploring trails near the city.',
    category: HobbyCategory.OUTDOORS,
    memberCount: 900,
    image: 'https://picsum.photos/800/400?random=5',
    icon: '🌲',
    rules: [
        'Leave no trace principles.',
        'Share trail conditions if known.',
        'Coordinate carpools responsibly.'
    ]
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    hobbyId: 'h1',
    content: 'Hit a personal best 5k today! The morning mist was incredible.',
    imageUrl: 'https://picsum.photos/600/400?random=10',
    likes: 42,
    comments: [
      { id: 'c1', userId: 'u3', content: 'Way to go!', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { id: 'c2', userId: 'u1', content: 'What is your pace?', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'p2',
    userId: 'u3',
    hobbyId: 'h3',
    content: 'Just finished "The Midnight Library". Highly recommend it to everyone here! What should we read next?',
    likes: 89,
    comments: [
        { id: 'c3', userId: 'u2', content: 'Added to my list!', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    id: 'p3',
    userId: 'u1',
    hobbyId: 'h1',
    content: 'Struggled to get out of bed, but did a quick 3k. Consistency is key!',
    likes: 15,
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];

export const MOCK_USERS: Record<string, User> = {
  'u1': CURRENT_USER,
  'u2': { 
    id: 'u2', 
    name: 'Sarah J.', 
    avatar: 'https://picsum.photos/151/151', 
    bio: 'Marathon runner and coffee enthusiast.', 
    joinedHobbies: ['h1'],
    hobbyStreaks: { 'h1': 21 },
    privacySettings: { profileVisibility: 'public' },
    following: [],
    followers: ['u1'],
    stats: { streak: 5, lastLogDate: new Date().toISOString(), totalLogs: 42, totalPoints: 1200 },
    unlockedAchievements: ['a1', 'a2', 'a3'],
    dailyChallenges: []
  },
  'u3': { 
    id: 'u3', 
    name: 'Mike T.', 
    avatar: 'https://picsum.photos/152/152', 
    bio: 'Always reading or coding.', 
    joinedHobbies: ['h3', 'h4'],
    hobbyStreaks: { 'h3': 3, 'h4': 0 },
    privacySettings: { profileVisibility: 'public' },
    following: ['u1'],
    followers: [],
    stats: { streak: 12, lastLogDate: new Date().toISOString(), totalLogs: 85, totalPoints: 2400 },
    unlockedAchievements: ['a1', 'a2', 'a3', 'a5'],
    dailyChallenges: []
  },
};

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    participantId: 'u2',
    lastMessage: 'Are you joining the run tomorrow?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 1
  },
  {
    id: 'conv_2',
    participantId: 'u3',
    lastMessage: 'Thanks for the book recommendation!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 0
  }
];

export const MOCK_DIRECT_MESSAGES: Record<string, DirectMessage[]> = {
  'conv_1': [
    { id: 'm1', senderId: 'u2', text: 'Hey Alex!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'm2', senderId: 'u1', text: 'Hi Sarah, what is up?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString() },
    { id: 'm3', senderId: 'u2', text: 'Are you joining the run tomorrow?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }
  ],
  'conv_2': [
    { id: 'm4', senderId: 'u1', text: 'Here is the link to the book.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() },
    { id: 'm5', senderId: 'u3', text: 'Thanks for the book recommendation!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
  ]
};

export const MOCK_REMINDERS: Reminder[] = [
  {
    id: 'r1',
    text: 'Go for a run',
    date: new Date(new Date().setHours(7, 0, 0, 0)),
    completed: true
  },
  {
    id: 'r2',
    text: 'Read Chapter 4',
    date: new Date(new Date().setHours(20, 0, 0, 0)),
    completed: false
  }
];