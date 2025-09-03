import { createClient } from '@/lib/supabase/server';
import type { Badge, UserBadge, BadgeStats } from '@/types/badges';

export class BadgeService {
  private async getSupabase() {
    return createClient();
  }

  /**
   * ユーザーのバッジ一覧を取得
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .rpc('get_user_badges', { target_user_id: userId });
    
    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      userId,
      badgeId: item.badge_id,
      badge: {
        id: item.badge_id,
        name: item.badge_name,
        slug: item.badge_slug,
        icon: item.badge_icon,
        category: item.badge_category,
        difficulty: this.mapDifficulty(item.badge_difficulty),
        description: item.badge_description || '',
        conditionType: '',
        conditionValue: {},
        unlocksFeatures: [],
        isActive: true,
        createdAt: '',
        updatedAt: ''
      },
      earnedAt: item.earned_at,
      personalNote: item.personal_note,
      stats: item.stats || {}
    }));
  }

  /**
   * 利用可能なバッジ一覧を取得
   */
  async getAvailableBadges(): Promise<Badge[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching available badges:', error);
      return [];
    }

    return data.map(this.mapBadgeFromDB);
  }

  /**
   * ユーザーがアクセス可能なチャレンジを取得
   */
  async getAccessibleChallenges(userId: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .rpc('get_accessible_challenges', { target_user_id: userId });

    if (error) {
      console.error('Error fetching accessible challenges:', error);
      return [];
    }

    return data;
  }

  /**
   * チャレンジ完了時にバッジを授与
   */
  async awardBadgeForChallenge(
    userId: string,
    challengeId: string,
    personalNote?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      // チャレンジ情報を取得
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*, reward_badge_slug:reward->badge_slug')
        .eq('id', challengeId)
        .single();

      if (!challenge || !challenge.reward_badge_slug) {
        return false;
      }

      // 進捗データを取得して統計を計算
      const stats = await this.calculateAchievementStats(userId, challengeId);

      // バッジを授与
      const { data, error } = await supabase
        .rpc('award_badge_to_user', {
          target_user_id: userId,
          badge_slug: challenge.reward_badge_slug,
          challenge_id: challengeId,
          user_note: personalNote || null,
          achievement_stats: stats
        });

      if (error) {
        console.error('Error awarding badge:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in awardBadgeForChallenge:', error);
      return false;
    }
  }

  /**
   * チャレンジの達成統計を計算
   */
  private async calculateAchievementStats(
    userId: string,
    challengeId: string
  ): Promise<BadgeStats> {
    const supabase = await this.getSupabase();
    // チャレンジ参加情報を取得
    const { data: participation } = await supabase
      .from('challenge_participations')
      .select('*')
      .match({ user_id: userId, challenge_id: challengeId })
      .single();

    // 日次進捗を取得
    const { data: dailyProgress } = await supabase
      .from('daily_progress')
      .select('*')
      .match({ user_id: userId, challenge_id: challengeId })
      .order('day_number');

    if (!participation || !dailyProgress) {
      return {
        challengeDuration: 0,
        completionRate: 0
      };
    }

    const completedDays = dailyProgress.filter(d => d.status === 'completed');
    const totalDays = dailyProgress.length;
    
    // パフォーマンスデータの分析
    const performanceData = completedDays
      .map(d => d.performance_data)
      .filter(Boolean);

    let improvementData;
    if (performanceData.length >= 2) {
      const first = performanceData[0];
      const last = performanceData[performanceData.length - 1];
      improvementData = {
        before: this.formatPerformanceData(first),
        after: this.formatPerformanceData(last),
        improvementPercentage: this.calculateImprovement(first, last)
      };
    }

    // 連続記録の計算
    const streakData = {
      longestStreak: this.calculateLongestStreak(dailyProgress),
      finalStreak: this.calculateFinalStreak(dailyProgress)
    };

    return {
      challengeDuration: totalDays,
      improvementData,
      streakData,
      completionRate: Math.round((completedDays.length / totalDays) * 100)
    };
  }

  /**
   * チャレンジ完了条件をチェック
   */
  async checkChallengeCompletion(
    userId: string,
    challengeId: string
  ): Promise<boolean> {
    const supabase = await this.getSupabase();
    // チャレンジ情報を取得
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) return false;

    // 進捗情報を取得
    const { data: progress } = await supabase
      .from('daily_progress')
      .select('*')
      .match({ user_id: userId, challenge_id: challengeId });

    if (!progress) return false;

    const completedDays = progress.filter(p => p.status === 'completed').length;
    const totalDays = challenge.duration || progress.length;
    const completionRate = (completedDays / totalDays) * 100;
    
    // デフォルト完了条件: 90%以上の達成率
    const requiredCompletionRate = challenge.required_completion_rate || 90;
    
    return completionRate >= requiredCompletionRate;
  }

  /**
   * 日次チェックイン処理
   */
  async dailyCheckIn(
    userId: string,
    challengeId: string,
    dayNumber: number,
    performanceData?: any,
    notes?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      // 今日の進捗を更新
      const { error: progressError } = await supabase
        .from('daily_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes || null,
          performance_data: performanceData || null
        })
        .match({
          user_id: userId,
          challenge_id: challengeId,
          day_number: dayNumber
        });

      if (progressError) {
        console.error('Error updating progress:', progressError);
        return false;
      }

      // 参加記録を更新
      await this.updateParticipationStats(userId, challengeId);

      // 完了条件をチェック
      const isCompleted = await this.checkChallengeCompletion(userId, challengeId);
      if (isCompleted) {
        await this.awardBadgeForChallenge(userId, challengeId);
      }

      return true;
    } catch (error) {
      console.error('Error in dailyCheckIn:', error);
      return false;
    }
  }

  /**
   * 参加統計を更新
   */
  private async updateParticipationStats(
    userId: string,
    challengeId: string
  ): Promise<void> {
    const supabase = await this.getSupabase();
    // 完了した日数を計算
    const { data: progress } = await supabase
      .from('daily_progress')
      .select('status')
      .match({ user_id: userId, challenge_id: challengeId });

    if (!progress) return;

    const completedDays = progress.filter(p => p.status === 'completed').length;
    const totalDays = progress.length;
    const completionRate = Math.round((completedDays / totalDays) * 100);

    // 参加記録を更新
    await supabase
      .from('challenge_participations')
      .update({
        current_day: completedDays,
        completion_rate: completionRate,
        last_check_in: new Date().toISOString()
      })
      .match({ user_id: userId, challenge_id: challengeId });
  }

  // ヘルパーメソッド
  private mapBadgeFromDB(dbBadge: any): Badge {
    return {
      id: dbBadge.id,
      name: dbBadge.name,
      slug: dbBadge.slug,
      description: dbBadge.description,
      icon: dbBadge.icon,
      category: dbBadge.category,
      difficulty: this.mapDifficulty(dbBadge.difficulty),
      conditionType: dbBadge.condition_type,
      conditionValue: dbBadge.condition_value,
      unlocksFeatures: dbBadge.unlocks_features || [],
      isActive: dbBadge.is_active,
      createdAt: dbBadge.created_at,
      updatedAt: dbBadge.updated_at
    };
  }

  private mapDifficulty(difficulty: string): "初級" | "中級" | "上級" {
    switch (difficulty) {
      case '初級': return '初級';
      case '中級': return '中級';
      case '上級': return '上級';
      default: return '初級';
    }
  }

  private formatPerformanceData(data: any): string {
    if (data.duration) return data.duration;
    if (data.reps) return `${data.reps}回`;
    if (data.distance) return data.distance;
    return 'N/A';
  }

  private calculateImprovement(first: any, last: any): number {
    // 簡単な改善率計算（実際の実装では詳細なロジックが必要）
    if (first.duration && last.duration) {
      const firstSeconds = this.parseTimeToSeconds(first.duration);
      const lastSeconds = this.parseTimeToSeconds(last.duration);
      return Math.round(((lastSeconds - firstSeconds) / firstSeconds) * 100);
    }
    return 0;
  }

  private parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(/[分秒]/);
    let seconds = 0;
    if (parts.length >= 2) {
      seconds += parseInt(parts[0]) * 60; // 分
      if (parts[1]) seconds += parseInt(parts[1]); // 秒
    } else if (timeStr.includes('秒')) {
      seconds = parseInt(timeStr.replace('秒', ''));
    }
    return seconds;
  }

  private calculateLongestStreak(progress: any[]): number {
    let longest = 0;
    let current = 0;
    
    for (const day of progress) {
      if (day.status === 'completed') {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    
    return longest;
  }

  private calculateFinalStreak(progress: any[]): number {
    let streak = 0;
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i].status === 'completed') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}