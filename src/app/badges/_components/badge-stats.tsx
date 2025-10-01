'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockUserBadges, mockBadges } from '@/lib/mock-badge-data';
import { BADGE_CATEGORIES } from '@/types/badges';
import { Trophy, Target, TrendingUp, Calendar, Star, Award } from 'lucide-react';

export function BadgeStats(): React.JSX.Element {
  const totalBadges = mockBadges.length;
  const earnedBadges = mockUserBadges.length;
  const completionRate = Math.round((earnedBadges / totalBadges) * 100);
  
  // カテゴリー別統計
  const categoryStats = Object.keys(BADGE_CATEGORIES).map(category => {
    const categoryBadges = mockBadges.filter(b => b.category === category);
    const earnedCategoryBadges = mockUserBadges.filter(ub => ub.badge.category === category);
    const rate = categoryBadges.length > 0 ? Math.round((earnedCategoryBadges.length / categoryBadges.length) * 100) : 0;
    
    return {
      category,
      total: categoryBadges.length,
      earned: earnedCategoryBadges.length,
      rate,
      config: BADGE_CATEGORIES[category as keyof typeof BADGE_CATEGORIES]
    };
  });

  // 難易度別統計
  const difficultyStats = ['初級', '中級', '上級'].map(difficulty => {
    const difficultyBadges = mockBadges.filter(b => b.difficulty === difficulty);
    const earnedDifficultyBadges = mockUserBadges.filter(ub => ub.badge.difficulty === difficulty);
    
    return {
      difficulty,
      total: difficultyBadges.length,
      earned: earnedDifficultyBadges.length,
      rate: difficultyBadges.length > 0 ? Math.round((earnedDifficultyBadges.length / difficultyBadges.length) * 100) : 0
    };
  });

  // 平均達成率
  const averageCompletionRate = mockUserBadges.length > 0 
    ? Math.round(mockUserBadges.reduce((sum, ub) => sum + (ub.stats.completionRate || 0), 0) / mockUserBadges.length)
    : 0;

  // 最新獲得バッジ
  const latestBadge = mockUserBadges.sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())[0];

  return (
    <div className="space-y-6">
      {/* 総合統計 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            バッジ統計
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{earnedBadges}</div>
              <div className="text-sm text-gray-600">獲得済み</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{totalBadges}</div>
              <div className="text-sm text-gray-600">全バッジ</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>コンプリート率</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* カテゴリー別統計 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            カテゴリー別進捗
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryStats.map(stat => (
            <div key={stat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{stat.config.icon}</span>
                  <span className="text-sm font-medium">{stat.category}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {stat.earned}/{stat.total}
                </div>
              </div>
              <Progress value={stat.rate} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 難易度別統計 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-600" />
            難易度別実績
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {difficultyStats.map(stat => (
            <div key={stat.difficulty} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  className={
                    stat.difficulty === '初級' ? 'bg-green-100 text-green-800' :
                    stat.difficulty === '中級' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }
                  variant="secondary"
                >
                  {stat.difficulty}
                </Badge>
                <span className="text-sm">({stat.rate}%)</span>
              </div>
              <div className="text-sm text-gray-600">
                {stat.earned}/{stat.total}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* パフォーマンス */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            パフォーマンス
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{averageCompletionRate}%</div>
            <div className="text-sm text-gray-600">平均達成率</div>
          </div>
          
          {mockUserBadges.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">最高パフォーマンス</h4>
              <div className="text-sm text-gray-600">
                {Math.max(...mockUserBadges.map(ub => ub.stats.completionRate || 0))}% 
                ({mockUserBadges.find(ub => ub.stats.completionRate === Math.max(...mockUserBadges.map(ub => ub.stats.completionRate || 0)))?.badge.name})
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最新の獲得 */}
      {latestBadge && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              最新の獲得
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{latestBadge.badge.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {latestBadge.badge.name}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(latestBadge.earnedAt).toLocaleDateString('ja-JP')}獲得
                </div>
                {latestBadge.stats.completionRate && (
                  <div className="text-sm text-green-600">
                    達成率: {latestBadge.stats.completionRate}%
                  </div>
                )}
              </div>
            </div>
            
            {latestBadge.personalNote && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 italic">
                  &quot;{latestBadge.personalNote}&quot;
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
