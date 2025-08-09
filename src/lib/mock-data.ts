// Mock data for dashboard development
// TODO 後で削除する
export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: string;
  bio?: string;
  location?: string;
  joinedAt: string;
  experience: number; // years
  favoriteWorkouts: string[];
  goals: string[];
}

export interface MockStats {
  posts: number;
  sessions: number;
  challenges: number;
  followers: number;
  following: number;
  totalWorkouts: number;
  streakDays: number;
}

export interface MockPost {
  id: string;
  authorId: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  hasImage: boolean;
  imageUrl?: string;
  workoutType?: string;
  location?: string;
}

export interface MockSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number; // minutes
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  workoutType: string;
  level: string;
  hostId: string;
  hostName: string;
}

export interface MockChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number; // days
  currentDay: number;
  progress: number; // percentage
  participants: number;
  reward?: string;
}

export interface MockUserRecommendation {
  id: string;
  name: string;
  level: string;
  avatar?: string;
  mutualConnections: number;
  speciality: string;
  isFollowing: boolean;
}

// Mock Users
export const mockUsers: MockUser[] = [
  {
    id: 'user-1',
    name: '田中 太郎',
    email: 'tanaka@example.com',
    level: 'フィットネス中級者',
    bio: '筋トレとランニングが好きです。週5日ジムに通っています！',
    location: '東京都渋谷区',
    joinedAt: '2023-06-15',
    experience: 2,
    favoriteWorkouts: ['筋力トレーニング', 'ランニング', 'プランク'],
    goals: ['筋肉量増加', '体脂肪率減少', 'ベンチプレス100kg達成'],
  },
  {
    id: 'user-2',
    name: '佐藤 健',
    email: 'sato@example.com',
    level: 'フィットネス上級者',
    bio: 'パワーリフティング専門。デッドリフト200kg目標！',
    location: '神奈川県横浜市',
    joinedAt: '2022-03-20',
    experience: 5,
    favoriteWorkouts: ['デッドリフト', 'スクワット', 'ベンチプレス'],
    goals: ['デッドリフト200kg', 'スクワット180kg', 'ベンチプレス130kg'],
  },
  {
    id: 'user-3',
    name: '山田 花子',
    email: 'yamada@example.com',
    level: 'フィットネス初心者',
    bio: '健康のためにヨガとウォーキングを始めました☀️',
    location: '大阪府大阪市',
    joinedAt: '2024-01-10',
    experience: 0.5,
    favoriteWorkouts: ['ヨガ', 'ウォーキング', 'ストレッチ'],
    goals: ['柔軟性向上', '体力向上', '週3回運動習慣'],
  },
];

// Mock Stats
export const mockStats: MockStats = {
  posts: 24,
  sessions: 8,
  challenges: 3,
  followers: 42,
  following: 28,
  totalWorkouts: 156,
  streakDays: 12,
};

// Mock Timeline Posts
export const mockTimelinePosts: MockPost[] = [
  {
    id: 'post-1',
    authorId: 'user-2',
    author: '佐藤 健',
    content: '今日は新しいデッドリフトのPRを達成しました！150kgクリア🎉\nみなさんのサポートのおかげです。ありがとうございます！\n\n#デッドリフト #PR #筋トレ',
    timestamp: '2時間前',
    likes: 15,
    comments: 3,
    hasImage: true,
    workoutType: 'デッドリフト',
    location: 'ゴールドジム横浜',
  },
  {
    id: 'post-2',
    authorId: 'user-3',
    author: '山田 花子',
    content: '朝活でヨガセッションに参加しました☀️\n気持ちの良い一日のスタートです。次回もぜひ一緒に！\n\n今日学んだポーズ：\n・太陽礼拝\n・戦士のポーズ\n・猫と牛のポーズ\n\n#朝ヨガ #ヨガ #朝活',
    timestamp: '4時間前',
    likes: 8,
    comments: 2,
    hasImage: false,
    workoutType: 'ヨガ',
    location: 'スタジオ・オム',
  },
  {
    id: 'post-3',
    authorId: 'user-1',
    author: '田中 太郎',
    content: '今週の筋トレメニュー完了！💪\n\n月曜：胸・三頭筋\n火曜：背中・二頭筋\n水曜：肩・腹筋\n木曜：脚・臀部\n金曜：全身・有酸素\n\n来週からは重量をさらに上げていく予定です！\n\n#筋トレ #週間メニュー #継続',
    timestamp: '1日前',
    likes: 12,
    comments: 5,
    hasImage: true,
    workoutType: '筋力トレーニング',
    location: 'エニタイムフィットネス渋谷',
  },
];

// Mock Upcoming Sessions
export const mockUpcomingSessions: MockSession[] = [
  {
    id: 'session-1',
    title: '朝活ヨガクラス',
    description: '朝の清々しい空気の中で、一日を気持ちよくスタートしましょう',
    date: '2024-08-10',
    time: '07:00',
    duration: 60,
    location: 'スタジオ・オム 新宿店',
    maxParticipants: 15,
    currentParticipants: 12,
    workoutType: 'ヨガ',
    level: '初級',
    hostId: 'user-3',
    hostName: '山田 花子',
  },
  {
    id: 'session-2',
    title: '筋力トレーニング',
    description: '中級者向けの筋力トレーニングセッション。胸と腕を重点的に鍛えます',
    date: '2024-08-12',
    time: '18:30',
    duration: 90,
    location: 'ゴールドジム 横浜店',
    maxParticipants: 8,
    currentParticipants: 6,
    workoutType: '筋力トレーニング',
    level: '中級',
    hostId: 'user-2',
    hostName: '佐藤 健',
  },
  {
    id: 'session-3',
    title: 'ランニングクラブ',
    description: '皇居周辺を一緒に走りませんか？初心者でも大歓迎です',
    date: '2024-08-14',
    time: '19:00',
    duration: 75,
    location: '皇居外周',
    maxParticipants: 20,
    currentParticipants: 16,
    workoutType: 'ランニング',
    level: '全レベル',
    hostId: 'user-1',
    hostName: '田中 太郎',
  },
];

// Mock Active Challenges
export const mockActiveChallenges: MockChallenge[] = [
  {
    id: 'challenge-1',
    title: '30日プランクチャレンジ',
    description: '毎日少しずつプランクの時間を伸ばして、30日で3分間プランクを達成',
    category: '体幹強化',
    difficulty: '初級',
    duration: 30,
    currentDay: 18,
    progress: 60,
    participants: 127,
    reward: 'プランクマスターバッジ',
  },
  {
    id: 'challenge-2',
    title: '週5日運動習慣',
    description: '週5日間、何かしらの運動を継続するチャレンジ',
    category: '習慣化',
    difficulty: '中級',
    duration: 28,
    currentDay: 15,
    progress: 54,
    participants: 89,
    reward: 'コンシステンシーバッジ',
  },
  {
    id: 'challenge-3',
    title: '10000歩ウォーキング',
    description: '毎日10000歩以上歩くチャレンジ',
    category: '有酸素運動',
    difficulty: '初級',
    duration: 21,
    currentDay: 12,
    progress: 57,
    participants: 234,
    reward: 'ウォーカーバッジ',
  },
];

// Mock User Recommendations
export const mockUserRecommendations: MockUserRecommendation[] = [
  {
    id: 'rec-1',
    name: '鈴木 一郎',
    level: '筋トレエキスパート',
    mutualConnections: 3,
    speciality: 'ボディビルディング',
    isFollowing: false,
  },
  {
    id: 'rec-2',
    name: '林 美咲',
    level: 'ヨガインストラクター',
    mutualConnections: 2,
    speciality: 'ハタヨガ・瞑想',
    isFollowing: false,
  },
  {
    id: 'rec-3',
    name: '高橋 翔太',
    level: 'ランニングコーチ',
    mutualConnections: 1,
    speciality: 'マラソン・持久力',
    isFollowing: false,
  },
  {
    id: 'rec-4',
    name: '中村 あい',
    level: 'ピラティス愛好家',
    mutualConnections: 4,
    speciality: 'ピラティス・体幹',
    isFollowing: false,
  },
];

// Helper function to get user by ID
export const getUserById = (userId: string): MockUser | undefined => {
  return mockUsers.find(user => user.id === userId);
};

// Helper function to get current user (田中 太郎)
export const getCurrentUser = (): MockUser => {
  return mockUsers[0]; // 田中 太郎
};