// Badge system type definitions

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // emoji
  category: BadgeCategory;
  difficulty: BadgeDifficulty;
  conditionType: string;
  conditionValue: Record<string, any>;
  unlocksFeatures: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge; // populated badge data
  earnedAt: string;
  challengeId?: string;
  personalNote?: string;
  stats: BadgeStats;
}

export interface BadgeStats {
  challengeDuration?: number; // days
  improvementData?: {
    before: string;
    after: string;
    improvementPercentage?: number;
  };
  streakData?: {
    longestStreak: number;
    finalStreak: number;
  };
  completionRate?: number; // percentage
}

export interface ExclusiveChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  requiredBadgeId?: string;
  requiredBadge?: Badge; // populated badge data
  isExclusive: boolean;
  exclusiveMessage?: string;
  canParticipate: boolean; // calculated field
  reward?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  displayName: string; // name + badge icons
  level: string; // derived from badges
  expertiseAreas: string[]; // derived from badge categories
  badges: UserBadge[];
  totalBadges: number;
  latestBadgeEarned?: string;
}

// Enums and constants
export type BadgeCategory = 
  | '体幹強化' 
  | '習慣化' 
  | '有酸素運動' 
  | '筋力トレーニング' 
  | '柔軟性'
  | '時間管理';

export type BadgeDifficulty = '初級' | '中級' | '上級';

export const BADGE_CATEGORIES: Record<BadgeCategory, { name: string; color: string; icon: string }> = {
  '体幹強化': { name: '体幹強化', color: 'text-orange-600 bg-orange-100', icon: '🏆' },
  '習慣化': { name: '習慣化', color: 'text-purple-600 bg-purple-100', icon: '👑' },
  '有酸素運動': { name: '有酸素運動', color: 'text-green-600 bg-green-100', icon: '🚶' },
  '筋力トレーニング': { name: '筋力トレーニング', color: 'text-red-600 bg-red-100', icon: '💪' },
  '柔軟性': { name: '柔軟性', color: 'text-pink-600 bg-pink-100', icon: '🧘' },
  '時間管理': { name: '時間管理', color: 'text-blue-600 bg-blue-100', icon: '🌅' }
};

export const DIFFICULTY_CONFIG: Record<BadgeDifficulty, { color: string; label: string }> = {
  '初級': { color: 'bg-green-100 text-green-800', label: 'ビギナー' },
  '中級': { color: 'bg-orange-100 text-orange-800', label: 'インターミディエイト' },
  '上級': { color: 'bg-red-100 text-red-800', label: 'エキスパート' }
};

// Helper functions
export const getBadgeDisplayName = (userBadges: UserBadge[]): string => {
  const badgeIcons = userBadges.slice(0, 3).map(ub => ub.badge.icon).join('');
  return badgeIcons;
};

export const getUserLevel = (userBadges: UserBadge[]): string => {
  const badgeCount = userBadges.length;
  const expertBadges = userBadges.filter(ub => ub.badge.difficulty === '上級').length;
  
  if (expertBadges >= 2) return 'フィットネスマスター';
  if (badgeCount >= 3) return 'エキスパート';
  if (badgeCount >= 1) return 'アクティブメンバー';
  return 'ビギナー';
};

export const getExpertiseAreas = (userBadges: UserBadge[]): string[] => {
  const categories = new Set(userBadges.map(ub => ub.badge.category));
  return Array.from(categories);
};