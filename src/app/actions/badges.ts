'use server';

import { createClient } from '@/lib/supabase/server';
import { BadgeService } from '@/lib/badge-service';
import { ChallengeService } from '@/lib/challenge-service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const badgeService = new BadgeService();
const challengeService = new ChallengeService();

/**
 * ユーザーのバッジ一覧を取得
 */
export async function getUserBadges(userId: string) {
  try {
    const badges = await badgeService.getUserBadges(userId);
    return { success: true, data: badges };
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return { success: false, error: 'バッジの取得に失敗しました' };
  }
}

/**
 * 利用可能なバッジ一覧を取得
 */
export async function getAvailableBadges() {
  try {
    const badges = await badgeService.getAvailableBadges();
    return { success: true, data: badges };
  } catch (error) {
    console.error('Error fetching available badges:', error);
    return { success: false, error: 'バッジ情報の取得に失敗しました' };
  }
}

/**
 * ユーザーがアクセス可能なチャレンジを取得
 */
export async function getAccessibleChallenges(userId: string) {
  try {
    const challenges = await badgeService.getAccessibleChallenges(userId);
    return { success: true, data: challenges };
  } catch (error) {
    console.error('Error fetching accessible challenges:', error);
    return { success: false, error: 'チャレンジ情報の取得に失敗しました' };
  }
}

/**
 * チャレンジに参加
 */
export async function joinChallenge(userId: string, challengeId: string) {
  try {
    const success = await challengeService.joinChallenge(userId, challengeId);
    
    if (success) {
      revalidatePath('/challenges');
      revalidatePath('/dashboard');
      return { success: true, message: 'チャレンジに参加しました！' };
    } else {
      return { success: false, error: 'チャレンジへの参加に失敗しました' };
    }
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { success: false, error: 'チャレンジへの参加に失敗しました' };
  }
}

/**
 * チャレンジから退出
 */
export async function leaveChallenge(userId: string, challengeId: string) {
  try {
    const success = await challengeService.leaveChallenge(userId, challengeId);
    
    if (success) {
      revalidatePath('/challenges');
      revalidatePath('/dashboard');
      return { success: true, message: 'チャレンジから退出しました' };
    } else {
      return { success: false, error: 'チャレンジからの退出に失敗しました' };
    }
  } catch (error) {
    console.error('Error leaving challenge:', error);
    return { success: false, error: 'チャレンジからの退出に失敗しました' };
  }
}

/**
 * チャレンジを一時停止
 */
export async function pauseChallenge(userId: string, challengeId: string) {
  try {
    const success = await challengeService.pauseChallenge(userId, challengeId);
    
    if (success) {
      revalidatePath('/challenges');
      revalidatePath(`/challenges/${challengeId}`);
      return { success: true, message: 'チャレンジを一時停止しました' };
    } else {
      return { success: false, error: 'チャレンジの一時停止に失敗しました' };
    }
  } catch (error) {
    console.error('Error pausing challenge:', error);
    return { success: false, error: 'チャレンジの一時停止に失敗しました' };
  }
}

/**
 * チャレンジを再開
 */
export async function resumeChallenge(userId: string, challengeId: string) {
  try {
    const success = await challengeService.resumeChallenge(userId, challengeId);
    
    if (success) {
      revalidatePath('/challenges');
      revalidatePath(`/challenges/${challengeId}`);
      return { success: true, message: 'チャレンジを再開しました' };
    } else {
      return { success: false, error: 'チャレンジの再開に失敗しました' };
    }
  } catch (error) {
    console.error('Error resuming challenge:', error);
    return { success: false, error: 'チャレンジの再開に失敗しました' };
  }
}

/**
 * 日次チェックイン
 */
export async function performDailyCheckIn(
  userId: string,
  challengeId: string,
  dayNumber: number,
  performanceData?: any,
  notes?: string
) {
  try {
    const success = await challengeService.performCheckIn(
      userId,
      challengeId,
      dayNumber,
      performanceData,
      notes
    );
    
    if (success) {
      revalidatePath('/challenges');
      revalidatePath(`/challenges/${challengeId}`);
      revalidatePath('/badges');
      return { success: true, message: 'チェックインが完了しました！' };
    } else {
      return { success: false, error: 'チェックインに失敗しました' };
    }
  } catch (error) {
    console.error('Error performing check-in:', error);
    return { success: false, error: 'チェックインに失敗しました' };
  }
}

/**
 * チャレンジの進捗を取得
 */
export async function getChallengeProgress(userId: string, challengeId: string) {
  try {
    const progress = await challengeService.getChallengeProgress(userId, challengeId);
    return { success: true, data: progress };
  } catch (error) {
    console.error('Error fetching challenge progress:', error);
    return { success: false, error: '進捗情報の取得に失敗しました' };
  }
}

/**
 * 今日のチェックイン対象を取得
 */
export async function getTodayCheckIn(userId: string, challengeId: string) {
  try {
    const checkIn = await challengeService.getTodayCheckIn(userId, challengeId);
    return { success: true, data: checkIn };
  } catch (error) {
    console.error('Error fetching today check-in:', error);
    return { success: false, error: '本日のチェックイン情報の取得に失敗しました' };
  }
}

/**
 * チャレンジの参加者統計を取得
 */
export async function getChallengeStats(challengeId: string) {
  try {
    const stats = await challengeService.getChallengeStats(challengeId);
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching challenge stats:', error);
    return { success: false, error: 'チャレンジ統計の取得に失敗しました' };
  }
}

/**
 * チャレンジのリーダーボードを取得
 */
export async function getChallengeLeaderboard(challengeId: string, limit = 10) {
  try {
    const leaderboard = await challengeService.getChallengeLeaderboard(challengeId, limit);
    return { success: true, data: leaderboard };
  } catch (error) {
    console.error('Error fetching challenge leaderboard:', error);
    return { success: false, error: 'リーダーボードの取得に失敗しました' };
  }
}

/**
 * バッジ獲得（管理者用・テスト用）
 */
export async function awardBadgeToUser(
  userId: string,
  badgeSlug: string,
  challengeId?: string,
  personalNote?: string
) {
  try {
    const success = await badgeService.awardBadgeForChallenge(
      userId,
      challengeId || '',
      personalNote
    );
    
    if (success) {
      revalidatePath('/badges');
      revalidatePath('/dashboard');
      return { success: true, message: 'バッジが授与されました！' };
    } else {
      return { success: false, error: 'バッジの授与に失敗しました' };
    }
  } catch (error) {
    console.error('Error awarding badge:', error);
    return { success: false, error: 'バッジの授与に失敗しました' };
  }
}