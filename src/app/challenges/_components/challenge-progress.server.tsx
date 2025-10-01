import { createClient } from '@/lib/supabase/server';
import { ChallengeProgress } from './challenge-progress';
import type { MockChallenge } from '@/lib/mock-data';

export default async function ChallengeProgressServer({ challenge }: { challenge: MockChallenge }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ChallengeProgress challenge={challenge} canCheckIn={false} participationStatus="guest" />;
  }

  const { data: participationRow } = await supabase
    .from('challenge_participations')
    .select('status')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge.id)
    .maybeSingle<{ status: string | null }>();

  if (!participationRow) {
    return <ChallengeProgress challenge={challenge} canCheckIn={false} participationStatus="not_joined" />;
  }

  const participationStatus = participationRow.status ?? 'unknown';

  const { data } = await supabase
    .from('daily_progress')
    .select<{ day_number: number; target_date: string | null; status: string | null }>('day_number, target_date, status')
    .match({ user_id: user.id, challenge_id: challenge.id })
    .order('day_number', { ascending: true });

  const days = (data ?? []).map((row) => ({
    day: row.day_number,
    completed: row.status === 'completed',
    date: row.target_date ?? undefined,
  }));

  return (
    <ChallengeProgress
      challenge={challenge}
      initialDays={days}
      canCheckIn={participationStatus === 'active'}
      participationStatus={participationStatus}
    />
  );
}
