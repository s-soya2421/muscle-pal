import * as React from 'react';
import { ChallengesPageClient } from './_components/challenges-page-client';
import { createClient } from '@/lib/supabase/server';
import type { MockChallenge } from '@/lib/mock-data';
import type { ExclusiveChallenge } from '@/types/badges';
import type { ChallengeParticipationSummary } from './_components/challenges-list';

type AccessibleChallengeRow = {
  challenge_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  is_exclusive: boolean;
  required_badge_name: string | null;
  can_participate: boolean;
};

async function getChallengesData(): Promise<MockChallenge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('challenges')
    .select('id, title, description, category, difficulty, duration, participants, current_day, progress, reward')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Map DB rows to UI-friendly shape (MockChallenge)
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? '',
    difficulty: (row.difficulty ?? '初級') as MockChallenge['difficulty'],
    duration: row.duration,
    currentDay: row.current_day ?? 0,
    progress: row.progress ?? 0,
    participants: row.participants ?? 0,
    reward: row.reward ?? undefined,
  }));
}

export default async function ChallengesPage(): Promise<React.JSX.Element> {
  const challenges = await getChallengesData();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let serverExclusive: ExclusiveChallenge[] | undefined;
  let serverLocked: ExclusiveChallenge[] | undefined;
  let userParticipations: ChallengeParticipationSummary[] | undefined;
  if (user) {
    const { data: ex } = await supabase.rpc<AccessibleChallengeRow[]>('get_accessible_challenges', { target_user_id: user.id });
    if (ex && Array.isArray(ex)) {
      const mapped = ex.map((row) => ({
        id: row.challenge_id,
        title: row.title,
        description: row.description,
        category: row.category,
        difficulty: row.difficulty,
        duration: row.duration,
        requiredBadgeId: undefined,
        requiredBadge: undefined,
        isExclusive: row.is_exclusive,
        exclusiveMessage: row.required_badge_name ? `${row.required_badge_name}バッジが必要です` : undefined,
        canParticipate: row.can_participate,
        reward: undefined,
      })) as ExclusiveChallenge[];
      serverExclusive = mapped.filter(c => c.canParticipate);
      serverLocked = mapped.filter(c => !c.canParticipate);
    }

    const { data: participationRows } = await supabase
      .from('challenge_participations')
      .select<{ challenge_id: string; status: string }>('challenge_id, status')
      .eq('user_id', user.id);

    if (participationRows) {
      userParticipations = participationRows.map((row) => ({
        challengeId: row.challenge_id,
        status: row.status,
      }));
    }
  }
  return (
    <ChallengesPageClient
      challenges={challenges}
      exclusiveChallenges={serverExclusive}
      lockedChallenges={serverLocked}
      userParticipations={userParticipations}
    />
  );
}
