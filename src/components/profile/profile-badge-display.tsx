'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserBadge } from '@/types/badges';
import { BADGE_CATEGORIES, DIFFICULTY_CONFIG, getUserLevel, getExpertiseAreas } from '@/types/badges';
import { Trophy, Calendar, TrendingUp, Award } from 'lucide-react';

interface ProfileBadgeDisplayProps {
  userBadges: UserBadge[];
  isOwnProfile?: boolean;
}

export function ProfileBadgeDisplay({ userBadges, isOwnProfile = false }: ProfileBadgeDisplayProps): React.JSX.Element {
  const [selectedBadge, setSelectedBadge] = React.useState<UserBadge | null>(null);
  
  const userLevel = getUserLevel(userBadges);
  const expertiseAreas = getExpertiseAreas(userBadges);
  const badgeIcons = userBadges.slice(0, 5).map(ub => ub.badge.icon).join(' ');

  return (
    <div className="space-y-6">
      {/* Profile Header with Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="text-2xl">
              {badgeIcons || '🔰'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {isOwnProfile ? 'あなた' : 'ユーザー'} {badgeIcons}
              </h2>
              <p className="text-gray-600">レベル: {userLevel}</p>
              {expertiseAreas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {expertiseAreas.map(area => (
                    <Badge 
                      key={area} 
                      className={BADGE_CATEGORIES[area as keyof typeof BADGE_CATEGORIES]?.color || 'bg-gray-100 text-gray-800'}
                      variant="secondary"
                    >
                      {BADGE_CATEGORIES[area as keyof typeof BADGE_CATEGORIES]?.icon} {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{userBadges.length}</div>
              <div className="text-sm text-gray-600">獲得バッジ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(userBadges.reduce((sum, ub) => sum + (ub.stats.completionRate || 0), 0) / Math.max(userBadges.length, 1))}%
              </div>
              <div className="text-sm text-gray-600">平均達成率</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {userBadges.filter(ub => ub.badge.difficulty === '上級').length}
              </div>
              <div className="text-sm text-gray-600">上級バッジ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Collection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              バッジコレクション
            </h3>
            {isOwnProfile && (
              <Button variant="outline" size="sm">
                全て見る
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {userBadges.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                まだバッジがありません
              </h4>
              <p className="text-gray-600 mb-4">
                チャレンジに参加してバッジを獲得しましょう！
              </p>
              {isOwnProfile && (
                <Button>チャレンジを見る</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userBadges.map(userBadge => (
                <div
                  key={userBadge.id}
                  className="group cursor-pointer rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  onClick={() => setSelectedBadge(userBadge)}
                >
                  <div className="text-center space-y-2">
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                      {userBadge.badge.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {userBadge.badge.name}
                    </h4>
                    <Badge className={DIFFICULTY_CONFIG[userBadge.badge.difficulty]?.color} variant="secondary">
                      {userBadge.badge.difficulty}
                    </Badge>
                    <div className="text-xs text-gray-600">
                      {new Date(userBadge.earnedAt).toLocaleDateString('ja-JP')}獲得
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badge Detail Modal/Card */}
      {selectedBadge && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedBadge.badge.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedBadge.badge.name}
                  </h3>
                  <p className="text-gray-600">
                    {selectedBadge.badge.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBadge(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="flex items-center gap-4 text-sm">
              <Badge className={BADGE_CATEGORIES[selectedBadge.badge.category]?.color} variant="secondary">
                {BADGE_CATEGORIES[selectedBadge.badge.category]?.icon} {selectedBadge.badge.category}
              </Badge>
              <Badge className={DIFFICULTY_CONFIG[selectedBadge.badge.difficulty]?.color} variant="secondary">
                {selectedBadge.badge.difficulty}
              </Badge>
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">獲得日</div>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedBadge.earnedAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </div>
              
              {selectedBadge.stats.completionRate && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium">達成率</div>
                    <div className="text-sm text-gray-600">
                      {selectedBadge.stats.completionRate}%
                    </div>
                  </div>
                </div>
              )}
              
              {selectedBadge.stats.improvementData && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium">成長記録</div>
                    <div className="text-sm text-gray-600">
                      {selectedBadge.stats.improvementData.before} → {selectedBadge.stats.improvementData.after}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedBadge.stats.challengeDuration && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium">チャレンジ期間</div>
                    <div className="text-sm text-gray-600">
                      {selectedBadge.stats.challengeDuration}日間
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Note */}
            {selectedBadge.personalNote && (
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">思い出メモ</h4>
                <p className="text-gray-700 text-sm italic">
                  "{selectedBadge.personalNote}"
                </p>
              </div>
            )}

            {/* Unlocked Features */}
            <div className="p-4 bg-white rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">解放された機能</h4>
              <div className="flex flex-wrap gap-2">
                {selectedBadge.badge.unlocksFeatures.map(feature => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature === 'exclusive_challenges' && '🔓 限定チャレンジ'}
                    {feature === 'expertise_display' && '🎯 専門分野表示'}
                    {feature === 'mentor_status' && '👨‍🏫 メンター資格'}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}