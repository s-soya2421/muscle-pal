'use client';

import { useState } from 'react';
import * as React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { MockChallenge } from '@/lib/mock-data';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  Play, 
  Pause,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ChallengeDetailProps {
  challenge: MockChallenge;
}

export function ChallengeDetail({ challenge }: ChallengeDetailProps): React.JSX.Element {
  const [isParticipating, setIsParticipating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  const handleParticipation = (): void => {
    setIsParticipating(!isParticipating);
  };

  const handlePauseResume = (): void => {
    setIsPaused(!isPaused);
  };

  const daysRemaining = challenge.duration - challenge.currentDay;
  const progressPercentage = (challenge.currentDay / challenge.duration) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {challenge.title}
            </h1>
            <p className="text-gray-600 mb-4">
              {challenge.description}
            </p>
          </div>
          <Badge className={getDifficultyColor(challenge.difficulty)}>
            {challenge.difficulty}
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>{challenge.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{challenge.duration}日間</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{challenge.participants}人参加中</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>残り{daysRemaining}日</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 進捗状況 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">進捗状況</h3>
            <span className="text-sm text-gray-600">
              {challenge.currentDay}/{challenge.duration}日目
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{Math.round(progressPercentage)}% 完了</span>
            <span className="text-gray-600">
              {challenge.currentDay >= challenge.duration ? '完了！' : `${daysRemaining}日残り`}
            </span>
          </div>
        </div>

        {/* 報酬 */}
        {challenge.reward && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-900">獲得可能な報酬</h4>
                <p className="text-orange-800">{challenge.reward}</p>
              </div>
            </div>
          </div>
        )}

        {/* チャレンジルール */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">チャレンジルール</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>毎日の目標を達成してチェックイン</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>進捗を記録して仲間と共有</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>チャレンジ期間中は継続を心がける</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>完了時に報酬バッジを獲得</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 参加ボタン */}
        <div className="flex gap-3">
          {!isParticipating ? (
            <Button 
              onClick={handleParticipation} 
              className="flex-1"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              チャレンジに参加する
            </Button>
          ) : (
            <div className="flex gap-3 flex-1">
              <Button 
                onClick={handlePauseResume}
                variant={isPaused ? "default" : "outline"}
                className="flex-1"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    再開する
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    一時停止
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsParticipating(false)}>
                退出
              </Button>
            </div>
          )}
        </div>

        {isParticipating && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">チャレンジ参加中</h4>
                <p className="text-sm text-blue-800">
                  {isPaused ? '一時停止中です' : '頑張って継続しましょう！'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}