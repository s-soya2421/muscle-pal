import type { Badge, UserBadge, ExclusiveChallenge } from '@/types/badges';

// Mock Badge definitions
export const mockBadges: Badge[] = [
  {
    id: 'badge-1',
    name: 'プランクマスター',
    slug: 'plank_master',
    description: '30日間プランクチャレンジを完了した体幹強化のエキスパート',
    icon: '🏆',
    category: '体幹強化',
    difficulty: '中級',
    conditionType: 'challenge_completion',
    conditionValue: { challengeSlug: '30-day-plank', requiredCompletionRate: 90 },
    unlocksFeatures: ['exclusive_challenges', 'expertise_display', 'mentor_status'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'badge-2',
    name: '継続王',
    slug: 'consistency_king',
    description: '週5日運動習慣チャレンジを完了した継続の達人',
    icon: '👑',
    category: '習慣化',
    difficulty: '中級',
    conditionType: 'challenge_completion',
    conditionValue: { challengeSlug: 'weekly-5-exercise', requiredCompletionRate: 85 },
    unlocksFeatures: ['exclusive_challenges', 'expertise_display', 'habit_tools'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'badge-3',
    name: 'ウォーキング王',
    slug: 'walker_champion',
    description: '10000歩ウォーキングチャレンジを完了した有酸素運動のエキスパート',
    icon: '🚶',
    category: '有酸素運動',
    difficulty: '初級',
    conditionType: 'challenge_completion',
    conditionValue: { challengeSlug: '10000-steps', requiredCompletionRate: 90 },
    unlocksFeatures: ['exclusive_challenges', 'expertise_display', 'route_sharing'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'badge-4',
    name: '早起きマスター',
    slug: 'early_bird_master',
    description: '朝活チャレンジを完了した時間管理のプロ',
    icon: '🌅',
    category: '時間管理',
    difficulty: '上級',
    conditionType: 'challenge_completion',
    conditionValue: { challengeSlug: 'morning-routine', requiredCompletionRate: 95 },
    unlocksFeatures: ['exclusive_challenges', 'expertise_display', 'morning_tools'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'badge-5',
    name: '筋トレエキスパート',
    slug: 'strength_expert',
    description: '筋力トレーニングチャレンジを完了した筋トレのプロ',
    icon: '💪',
    category: '筋力トレーニング',
    difficulty: '上級',
    conditionType: 'challenge_completion',
    conditionValue: { challengeSlug: 'strength-training', requiredCompletionRate: 85 },
    unlocksFeatures: ['exclusive_challenges', 'expertise_display', 'workout_plans'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

// Mock User Badge achievements
export const mockUserBadges: UserBadge[] = [
  {
    id: 'user-badge-1',
    userId: 'user-1',
    badgeId: 'badge-1',
    badge: mockBadges[0], // プランクマスター
    earnedAt: '2025-01-15T10:30:00Z',
    challengeId: 'challenge-1',
    personalNote: '風邪で2日休んだけど、最後まで諦めなかった！毎朝5時に頑張りました。',
    stats: {
      challengeDuration: 30,
      improvementData: {
        before: '30秒',
        after: '3分',
        improvementPercentage: 600
      },
      streakData: {
        longestStreak: 12,
        finalStreak: 8
      },
      completionRate: 93
    }
  },
  {
    id: 'user-badge-2',
    userId: 'user-1',
    badgeId: 'badge-3',
    badge: mockBadges[2], // ウォーキング王
    earnedAt: '2025-01-25T18:45:00Z',
    challengeId: 'challenge-3',
    personalNote: '家族と一緒に歩けて楽しかった！雨の日も室内で足踏みして継続。',
    stats: {
      challengeDuration: 21,
      improvementData: {
        before: '平均7000歩',
        after: '平均12000歩',
        improvementPercentage: 71
      },
      streakData: {
        longestStreak: 15,
        finalStreak: 15
      },
      completionRate: 95
    }
  }
];

// Mock Exclusive Challenges
export const mockExclusiveChallenges: ExclusiveChallenge[] = [
  {
    id: 'exclusive-1',
    title: 'プランク地獄30分',
    description: '30分間連続でプランクにチャレンジ。基礎をマスターした方のみ参加可能。',
    category: '体幹強化',
    difficulty: '上級',
    duration: 1,
    requiredBadgeId: 'badge-1',
    requiredBadge: mockBadges[0],
    isExclusive: true,
    exclusiveMessage: 'プランクマスターバッジが必要です。まずは基礎チャレンジから始めましょう。',
    canParticipate: true, // user-1 はプランクマスターを持っている
    reward: 'プランク地獄サバイバーバッジ'
  },
  {
    id: 'exclusive-2',
    title: '習慣化エキスパート道場',
    description: '複数の習慣を同時に身につける上級者向けチャレンジ',
    category: '習慣化',
    difficulty: '上級',
    duration: 30,
    requiredBadgeId: 'badge-2',
    requiredBadge: mockBadges[1],
    isExclusive: true,
    exclusiveMessage: '継続王バッジが必要です。習慣化の基礎を身につけてからご参加ください。',
    canParticipate: false, // user-1 は継続王を持っていない
    reward: 'ライフスタイルマスターバッジ'
  },
  {
    id: 'exclusive-3',
    title: '月間300kmウォーキング',
    description: '1ヶ月で300km歩く長距離チャレンジ',
    category: '有酸素運動',
    difficulty: '上級',
    duration: 30,
    requiredBadgeId: 'badge-3',
    requiredBadge: mockBadges[2],
    isExclusive: true,
    exclusiveMessage: 'ウォーキング王バッジが必要です。基礎体力をつけてからチャレンジしましょう。',
    canParticipate: true, // user-1 はウォーキング王を持っている
    reward: 'ロングディスタンスウォーカーバッジ'
  },
  {
    id: 'exclusive-4',
    title: '朝5時起き×筋トレ',
    description: '早朝筋トレの究極コンボチャレンジ',
    category: '筋力トレーニング',
    difficulty: '上級',
    duration: 14,
    requiredBadgeId: 'badge-4',
    requiredBadge: mockBadges[3],
    isExclusive: true,
    exclusiveMessage: '早起きマスターバッジが必要です。',
    canParticipate: false, // user-1 は早起きマスターを持っていない
    reward: 'モーニングウォリアーバッジ'
  }
];

// Helper function to get user's accessible exclusive challenges
export const getUserAccessibleExclusiveChallenges = (userBadges: UserBadge[]): ExclusiveChallenge[] => {
  const userBadgeIds = userBadges.map(ub => ub.badgeId);
  
  return mockExclusiveChallenges.map(challenge => ({
    ...challenge,
    canParticipate: challenge.requiredBadgeId ? userBadgeIds.includes(challenge.requiredBadgeId) : true
  }));
};

// Helper function to get user's locked exclusive challenges  
export const getUserLockedExclusiveChallenges = (userBadges: UserBadge[]): ExclusiveChallenge[] => {
  const userBadgeIds = userBadges.map(ub => ub.badgeId);
  
  return mockExclusiveChallenges
    .map(challenge => ({
      ...challenge,
      canParticipate: challenge.requiredBadgeId ? userBadgeIds.includes(challenge.requiredBadgeId) : true
    }))
    .filter(challenge => !challenge.canParticipate);
};
