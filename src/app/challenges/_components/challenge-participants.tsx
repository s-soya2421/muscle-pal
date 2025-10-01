'use client';

import { useState } from 'react';
import * as React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Crown, Medal, Award } from 'lucide-react';

interface ChallengeParticipantsProps {
  challengeId: string;
  participants?: Participant[];
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  progress: number;
  streak: number;
  rank: number;
  level: string;
  completedDays: number;
  isOnline: boolean;
}

export function ChallengeParticipants({ challengeId, participants: initial }: ChallengeParticipantsProps): React.JSX.Element {
  // Use provided participants or fallback to mock
  const [participants] = useState<Participant[]>(initial ?? [
    {
      id: '1',
      name: '田中 太郎',
      progress: 85,
      streak: 7,
      rank: 1,
      level: '中級者',
      completedDays: 17,
      isOnline: true,
    },
    {
      id: '2',
      name: '佐藤 健',
      progress: 78,
      streak: 5,
      rank: 2,
      level: '上級者',
      completedDays: 16,
      isOnline: false,
    },
    {
      id: '3',
      name: '山田 花子',
      progress: 72,
      streak: 4,
      rank: 3,
      level: '初心者',
      completedDays: 15,
      isOnline: true,
    },
    {
      id: '4',
      name: '鈴木 一郎',
      progress: 68,
      streak: 3,
      rank: 4,
      level: '中級者',
      completedDays: 14,
      isOnline: false,
    },
    {
      id: '5',
      name: '高橋 美咲',
      progress: 65,
      streak: 6,
      rank: 5,
      level: '初心者',
      completedDays: 13,
      isOnline: true,
    },
  ]);

  const [showAll, setShowAll] = useState(false);
  const displayedParticipants = showAll ? participants : participants.slice(0, 5);

  const getRankIcon = (rank: number): React.JSX.Element => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500">#{rank}</span>;
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case '初心者':
        return 'bg-green-100 text-green-800';
      case '中級者':
        return 'bg-blue-100 text-blue-800';
      case '上級者':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <Card data-challenge-id={challengeId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            参加者リスト
          </h3>
          <Badge variant="outline">
            {participants.length}人参加中
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* トップランカー */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">リーダーボード</h4>
          <div className="space-y-2">
            {displayedParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-[2rem]">
                  {getRankIcon(participant.rank)}
                </div>

                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.avatar ?? ""} alt={participant.name} />
                    <AvatarFallback className="text-sm">
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  {participant.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900 truncate">
                      {participant.name}
                    </h5>
                    <Badge className={getLevelColor(participant.level)} variant="secondary">
                      {participant.level}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{participant.completedDays}日完了</span>
                    <span>•</span>
                    <span>{participant.streak}日連続</span>
                    <span>•</span>
                    <span>{participant.progress}%</span>
                  </div>

                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${participant.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 参加者をもっと見る */}
        {participants.length > 5 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? '表示を減らす' : `他${participants.length - 5}人を表示`}
          </Button>
        )}

        {/* 統計情報 */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <h4 className="text-sm font-medium text-gray-700">参加者統計</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(participants.reduce((sum, p) => sum + p.progress, 0) / participants.length)}%
              </div>
              <div className="text-xs text-gray-600">平均進捗率</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {Math.round(participants.reduce((sum, p) => sum + p.streak, 0) / participants.length)}日
              </div>
              <div className="text-xs text-gray-600">平均連続日数</div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">オンライン参加者</span>
              <span className="font-medium text-green-600">
                {participants.filter(p => p.isOnline).length}人
              </span>
            </div>
          </div>
        </div>

        {/* 応援メッセージ */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">みんなで頑張ろう！</h4>
          <p className="text-sm text-blue-800">
            チャレンジを継続して、一緒に目標を達成しましょう。
            仲間がいるから頑張れる！
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
