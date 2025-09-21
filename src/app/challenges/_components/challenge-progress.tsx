'use client';

import { useState } from 'react';
import * as React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MockChallenge } from '@/lib/mock-data';
import { CheckCircle2, Circle, Calendar } from 'lucide-react';

interface ChallengeProgressProps {
  challenge: MockChallenge;
}

interface DayProgress {
  day: number;
  completed: boolean;
  date: Date;
}

export function ChallengeProgress({ challenge }: ChallengeProgressProps): React.JSX.Element {
  // Generate progress days based on challenge data
  const generateProgressDays = (): DayProgress[] => {
    const days: DayProgress[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - challenge.currentDay + 1);

    for (let i = 1; i <= challenge.duration; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i - 1);
      
      days.push({
        day: i,
        completed: i <= challenge.currentDay,
        date
      });
    }
    
    return days;
  };

  const [progressDays] = useState(generateProgressDays());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = new Date();
  const currentWeek = Math.ceil(challenge.currentDay / 7);
  const totalWeeks = Math.ceil(challenge.duration / 7);

  const formatDate = (date: Date): string => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getDayStatus = (day: DayProgress): 'completed' | 'current' | 'upcoming' | 'missed' => {
    if (day.completed) return 'completed';
    if (day.day === challenge.currentDay + 1) return 'current';
    if (day.day > challenge.currentDay + 1) return 'upcoming';
    return 'missed';
  };

  const getDayStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string): React.JSX.Element => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'current':
        return <Circle className="h-4 w-4 fill-current" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  // Group days by weeks for better display
  const weekGroups: DayProgress[][] = [];
  for (let i = 0; i < progressDays.length; i += 7) {
    weekGroups.push(progressDays.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">進捗カレンダー</h3>
          <Badge variant="outline">
            {currentWeek}/{totalWeeks}週目
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>完了</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-blue-600 fill-current" />
            <span>今日</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-gray-400" />
            <span>未来</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {weekGroups.map((week, weekIndex) => (
            <div key={weekIndex} className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                {weekIndex + 1}週目
              </h4>
              <div className="grid grid-cols-7 gap-2">
                {week.map((day) => {
                  const status = getDayStatus(day);
                  return (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDay(selectedDay === day.day ? null : day.day)}
                      className={`
                        relative h-12 w-full rounded-lg border-2 transition-all duration-200
                        flex flex-col items-center justify-center gap-1
                        hover:scale-105 hover:shadow-sm
                        ${getDayStatusColor(status)}
                        ${selectedDay === day.day ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                      `}
                    >
                      <div className="flex items-center justify-center">
                        {getStatusIcon(status)}
                      </div>
                      <span className="text-xs font-medium">
                        {day.day}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatDate(day.date)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedDay && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">
                  {selectedDay}日目
                </h4>
                <p className="text-sm text-gray-600">
                  {formatDate(progressDays[selectedDay - 1].date)}
                  {selectedDay <= challenge.currentDay ? ' - 完了済み' : ' - 未完了'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 今日のチャレンジ */}
        {challenge.currentDay < challenge.duration && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">
                  今日のチャレンジ ({challenge.currentDay + 1}日目)
                </h4>
                <p className="text-sm text-blue-800">
                  今日の目標を達成してチェックインしましょう
                </p>
              </div>
              <Button size="sm">
                チェックイン
              </Button>
            </div>
          </div>
        )}

        {/* 統計情報 */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {challenge.currentDay}
            </div>
            <div className="text-xs text-gray-600">完了日数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((challenge.currentDay / challenge.duration) * 100)}%
            </div>
            <div className="text-xs text-gray-600">達成率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(0, challenge.duration - challenge.currentDay)}
            </div>
            <div className="text-xs text-gray-600">残り日数</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}