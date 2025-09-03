'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockUserBadges, mockBadges } from '@/lib/mock-badge-data';
import type { UserBadge, Badge as BadgeType } from '@/types/badges';
import { BADGE_CATEGORIES, DIFFICULTY_CONFIG } from '@/types/badges';
import { Search, Trophy, Calendar, TrendingUp, Target, Lock } from 'lucide-react';

export function BadgeCollection(): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [activeTab, setActiveTab] = useState('earned');

  // フィルタリング
  const filteredUserBadges = mockUserBadges.filter(badge =>
    badge.badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.badge.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 未獲得バッジ
  const earnedBadgeIds = mockUserBadges.map(ub => ub.badgeId);
  const availableBadges = mockBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

  return (
    <div className="space-y-6">
      {/* 検索とフィルター */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="バッジを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earned" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            獲得済み ({mockUserBadges.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            未獲得 ({availableBadges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="space-y-6">
          {/* 獲得済みバッジ */}
          {filteredUserBadges.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                該当するバッジが見つかりません
              </h3>
              <p className="text-gray-600">
                検索条件を変更してお試しください
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredUserBadges.map(userBadge => (
                <EarnedBadgeCard 
                  key={userBadge.id} 
                  userBadge={userBadge}
                  onClick={() => setSelectedBadge(userBadge)}
                  isSelected={selectedBadge?.id === userBadge.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          {/* 未獲得バッジ */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {availableBadges.map(badge => (
              <AvailableBadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 選択されたバッジの詳細 */}
      {selectedBadge && (
        <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{selectedBadge.badge.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedBadge.badge.name}
                  </h3>
                  <p className="text-gray-600">
                    {selectedBadge.badge.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={BADGE_CATEGORIES[selectedBadge.badge.category]?.color}>
                      {BADGE_CATEGORIES[selectedBadge.badge.category]?.icon} {selectedBadge.badge.category}
                    </Badge>
                    <Badge className={DIFFICULTY_CONFIG[selectedBadge.badge.difficulty]?.color}>
                      {selectedBadge.badge.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBadge(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 獲得情報 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">獲得情報</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium">獲得日</div>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedBadge.earnedAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
                
                {selectedBadge.stats.completionRate && (
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium">達成率</div>
                      <div className="text-sm text-gray-600">
                        {selectedBadge.stats.completionRate}%
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedBadge.stats.challengeDuration && (
                  <div className="flex items-center gap-3">
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
            </div>

            {/* 成長記録 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">成長記録</h4>
              {selectedBadge.stats.improvementData ? (
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {selectedBadge.stats.improvementData.improvementPercentage}% 向上！
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedBadge.stats.improvementData.before} → {selectedBadge.stats.improvementData.after}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  成長記録はありません
                </div>
              )}
              
              {selectedBadge.personalNote && (
                <div className="p-4 bg-white rounded-lg border">
                  <h5 className="font-medium text-gray-900 mb-2">思い出メモ</h5>
                  <p className="text-sm text-gray-700 italic">
                    "{selectedBadge.personalNote}"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 獲得済みバッジカード
function EarnedBadgeCard({ 
  userBadge, 
  onClick, 
  isSelected 
}: { 
  userBadge: UserBadge; 
  onClick: () => void; 
  isSelected: boolean; 
}): React.JSX.Element {
  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6 text-center space-y-3">
        <div className="text-4xl hover:scale-110 transition-transform duration-200">
          {userBadge.badge.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {userBadge.badge.name}
          </h3>
          <Badge className={DIFFICULTY_CONFIG[userBadge.badge.difficulty]?.color} variant="secondary">
            {userBadge.badge.difficulty}
          </Badge>
        </div>
        <div className="text-xs text-gray-600">
          {new Date(userBadge.earnedAt).toLocaleDateString('ja-JP')}獲得
        </div>
        {userBadge.stats.completionRate && (
          <div className="text-xs text-green-600 font-medium">
            達成率: {userBadge.stats.completionRate}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 未獲得バッジカード
function AvailableBadgeCard({ badge }: { badge: BadgeType }): React.JSX.Element {
  return (
    <Card className="opacity-60 hover:opacity-80 transition-opacity duration-200">
      <CardContent className="p-6 text-center space-y-3">
        <div className="text-4xl grayscale">
          {badge.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-1">
            {badge.name}
          </h3>
          <Badge className={DIFFICULTY_CONFIG[badge.difficulty]?.color} variant="secondary">
            {badge.difficulty}
          </Badge>
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          <span>未獲得</span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">
          {badge.description}
        </p>
      </CardContent>
    </Card>
  );
}