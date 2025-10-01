import { createClient } from '@/lib/supabase/server';
import { BadgeService } from './badge-service';

type PerformanceData = {
  duration?: string;
  reps?: number;
  distance?: string;
  [key: string]: unknown;
};

export class ChallengeService {
  private async getSupabase() {
    return createClient();
  }
  private badgeService = new BadgeService();

  async joinChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const { data: existingParticipation } = await supabase
        .from('challenge_participations')
        .select('id')
        .match({ user_id: userId, challenge_id: challengeId })
        .single();

      if (existingParticipation) {
        return false;
      }

      const { data: challenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const { error: participationError } = await supabase
        .from('challenge_participations')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          started_at: new Date().toISOString(),
          status: 'active',
          current_day: 0,
          completion_rate: 0
        });

      if (participationError) {
        throw participationError;
      }

      const progressRecords = Array.from({ length: challenge.duration }, (_, i) => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        
        return {
          user_id: userId,
          challenge_id: challengeId,
          day_number: i + 1,
          target_date: targetDate.toISOString().split('T')[0],
          status: 'pending'
        };
      });

      const { error: progressError } = await supabase
        .from('daily_progress')
        .insert(progressRecords);

      if (progressError) {
        throw progressError;
      }

      await this.updateChallengeParticipantCount(challengeId);
      await this.refreshChallengeProgress(challengeId);

      return true;
    } catch (error) {
      console.error('Error joining challenge:', error);
      return false;
    }
  }

  async performCheckIn(
    userId: string,
    challengeId: string,
    dayNumber: number,
    performanceData?: PerformanceData,
    notes?: string
  ): Promise<boolean> {
    return await this.badgeService.dailyCheckIn(
      userId,
      challengeId,
      dayNumber,
      performanceData,
      notes
    );
  }

  // 他のメソッドは簡略化版を提供
  async leaveChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      await supabase.from('challenge_participations').delete().match({ user_id: userId, challenge_id: challengeId });
      await supabase.from('daily_progress').delete().match({ user_id: userId, challenge_id: challengeId });
      await this.updateChallengeParticipantCount(challengeId);
      await this.refreshChallengeProgress(challengeId);
      return true;
    } catch (error) {
      console.error('Error leaving challenge:', error);
      return false;
    }
  }

  async pauseChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('challenge_participations')
        .update({ status: 'paused', paused_at: new Date().toISOString() })
        .match({ user_id: userId, challenge_id: challengeId });
      return !error;
    } catch (error) {
      console.error('Error pausing challenge:', error);
      return false;
    }
  }

  async resumeChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('challenge_participations')
        .update({ status: 'active', resumed_at: new Date().toISOString() })
        .match({ user_id: userId, challenge_id: challengeId });
      return !error;
    } catch (error) {
      console.error('Error resuming challenge:', error);
      return false;
    }
  }

  async getUserActiveChallenges(userId: string) {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('challenge_participations')
        .select(`*, challenge:challenges(*)`)
        .eq('user_id', userId)
        .in('status', ['active', 'paused']);
      return data || [];
    } catch (error) {
      console.error('Error fetching user active challenges:', error);
      return [];
    }
  }

  async getChallengeProgress(userId: string, challengeId: string) {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .match({ user_id: userId, challenge_id: challengeId })
        .order('day_number');

      return data?.map(day => ({
        day: day.day_number,
        date: day.target_date,
        status: day.status,
        completed: day.status === 'completed',
        completedAt: day.completed_at,
        notes: day.notes,
        performance: day.performance_data
      })) || [];
    } catch (error) {
      console.error('Error fetching challenge progress:', error);
      return [];
    }
  }

  async getTodayCheckIn(userId: string, challengeId: string) {
    try {
      const supabase = await this.getSupabase();
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .match({ user_id: userId, challenge_id: challengeId, target_date: today })
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching today check-in:', error);
      return null;
    }
  }

  async getChallengeStats(challengeId: string) {
    return {
      totalParticipants: 0,
      activeParticipants: 0,
      completedParticipants: 0,
      averageCompletionRate: 0
    };
  }

  async getChallengeLeaderboard(challengeId: string, limit = 10) {
    return [];
  }

  private async updateChallengeParticipantCount(challengeId: string): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const { count } = await supabase
        .from('challenge_participations')
        .select('id', { head: true, count: 'exact' })
        .eq('challenge_id', challengeId);

      await supabase
        .from('challenges')
        .update({ participants: count ?? 0 })
        .eq('id', challengeId);
    } catch (error) {
      console.error('Failed to update challenge participant count:', error);
    }
  }

  private async refreshChallengeProgress(challengeId: string): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const { data } = await supabase
        .from('challenge_participations')
        .select('completion_rate')
        .eq('challenge_id', challengeId);

      if (!data || data.length === 0) {
        await supabase
          .from('challenges')
          .update({ progress: 0 })
          .eq('id', challengeId);
        return;
      }

      const total = data.reduce((acc, row) => acc + ((row as any).completion_rate ?? 0), 0);
      const average = Math.round(total / data.length);

      await supabase
        .from('challenges')
        .update({ progress: average })
        .eq('id', challengeId);
    } catch (error) {
      console.error('Failed to refresh challenge progress:', error);
    }
  }
}
// @ts-nocheck
