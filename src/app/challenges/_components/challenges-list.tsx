'use client';

import { useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockActiveChallenges } from '@/lib/mock-data';
import { mockUserBadges, getUserAccessibleExclusiveChallenges, getUserLockedExclusiveChallenges } from '@/lib/mock-badge-data';
import type { ExclusiveChallenge } from '@/types/badges';
import { Users, Trophy, Calendar, Target, Lock, Unlock } from 'lucide-react';

interface ChallengesListProps {
  filter?: string;
  category?: string;
  difficulty?: string;
}

export function ChallengesList({ filter, category, difficulty }: ChallengesListProps): React.JSX.Element {
  const [challenges] = useState(mockActiveChallenges);
  const [exclusiveChallenges] = useState(getUserAccessibleExclusiveChallenges(mockUserBadges));
  const [lockedChallenges] = useState(getUserLockedExclusiveChallenges(mockUserBadges));

  const filteredChallenges = challenges.filter((challenge) => {
    if (category && challenge.category !== category) return false;
    if (difficulty && challenge.difficulty !== difficulty) return false;
    if (filter) {
      const searchTerm = filter.toLowerCase();
      return (
        challenge.title.toLowerCase().includes(searchTerm) ||
        challenge.description.toLowerCase().includes(searchTerm) ||
        challenge.category.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case '初級':
        return 'bg-green-100 text-green-800';
      case '中級':
        return 'bg-orange-100 text-orange-800';
      case '上級':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* 限定チャレンジ（参加可能） */}
      {exclusiveChallenges.filter(c => c.canParticipate).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🔓 参加可能な限定チャレンジ ({exclusiveChallenges.filter(c => c.canParticipate).length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exclusiveChallenges.filter(c => c.canParticipate).map((challenge) => (
              <ExclusiveChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* 通常チャレンジ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            一般チャレンジ ({filteredChallenges.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChallenges.map((challenge) => (
          <Card key={challenge.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {challenge.description}
                  </p>
                </div>
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{challenge.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{challenge.duration}日間</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{challenge.participants}人参加</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">進捗状況</span>
                  <span className="font-medium">
                    {challenge.currentDay}/{challenge.duration}日目
                  </span>
                </div>
                <Progress value={challenge.progress} className="h-2" />
                <div className="text-right text-xs text-gray-500">
                  {challenge.progress}% 完了
                </div>
              </div>

              {challenge.reward && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Trophy className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800 font-medium">
                    報酬: {challenge.reward}
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-0">
              <div className="flex gap-2 w-full">
                <Button asChild className="flex-1">
                  <Link href={`/challenges/${challenge.id}`}>
                    詳細を見る
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  参加する
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
        </div>
      </div>

      {/* 未解放の限定チャレンジ */}
      {lockedChallenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🔒 未解放の限定チャレンジ ({lockedChallenges.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lockedChallenges.map((challenge) => (
              <LockedChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {filteredChallenges.length === 0 && exclusiveChallenges.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            該当するチャレンジが見つかりません
          </h3>
          <p className="text-gray-600">
            検索条件を変更して再度お試しください
          </p>
        </div>
      )}
    </div>
  );
}

// 限定チャレンジ（参加可能）用のカード
function ExclusiveChallengeCard({ challenge }: { challenge: ExclusiveChallenge }): React.JSX.Element {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case '初級':
        return 'bg-green-100 text-green-800';
      case '中級':
        return 'bg-orange-100 text-orange-800';
      case '上級':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Unlock className="h-4 w-4 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">限定チャレンジ</Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {challenge.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {challenge.description}
            </p>
          </div>
          <Badge className={getDifficultyColor(challenge.difficulty)}>
            {challenge.difficulty}
          </Badge>
        </div>
        
        {/* 必要バッジの表示 */}
        {challenge.requiredBadge && (
          <div className="flex items-center gap-2 p-2 bg-blue-100 rounded-lg">
            <span className="text-sm text-blue-800">
              必要バッジ: {challenge.requiredBadge.icon} {challenge.requiredBadge.name} ✅
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{challenge.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{challenge.duration}日間</span>
          </div>
        </div>

        {challenge.reward && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg">
            <Trophy className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800 font-medium">
              報酬: {challenge.reward}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          <Unlock className="h-4 w-4 mr-2" />
          限定チャレンジに参加
        </Button>
      </CardFooter>
    </Card>
  );
}

// ロックされた限定チャレンジ用のカード
function LockedChallengeCard({ challenge }: { challenge: ExclusiveChallenge }): React.JSX.Element {
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case '初級':
        return 'bg-green-100 text-green-800';
      case '中級':
        return 'bg-orange-100 text-orange-800';
      case '上級':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white opacity-75">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-gray-600" />
              <Badge className="bg-gray-100 text-gray-600">未解放</Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {challenge.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-2">
              {challenge.description}
            </p>
          </div>
          <Badge className={getDifficultyColor(challenge.difficulty)}>
            {challenge.difficulty}
          </Badge>
        </div>
        
        {/* 必要バッジの表示 */}
        {challenge.requiredBadge && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <Lock className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              必要バッジ: {challenge.requiredBadge.icon} {challenge.requiredBadge.name}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{challenge.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{challenge.duration}日間</span>
          </div>
        </div>

        {challenge.reward && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
            <Trophy className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              報酬: {challenge.reward}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full space-y-2">
          <Button disabled className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            参加不可
          </Button>
          <p className="text-xs text-red-600 text-center">
            {challenge.exclusiveMessage}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}