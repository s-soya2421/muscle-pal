import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { ChallengeParticipants } from './challenge-participants';

type LeaderboardRow =
  Database['public']['Functions']['get_challenge_leaderboard']['Returns'][number];

export default async function ChallengeParticipantsServer({ challengeId }: { challengeId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_challenge_leaderboard', {
    target_challenge_id: challengeId,
    limit_count: 10,
  });

  if (error) {
    console.error('Failed to load challenge leaderboard:', error);
  }

  const leaderboardRows: LeaderboardRow[] = Array.isArray(data) ? data : [];

  const participants = leaderboardRows.map((row, idx) => {
    const level = row.fitness_level === 'advanced'
      ? '上級者'
      : row.fitness_level === 'intermediate'
        ? '中級者'
        : '初心者';

    return {
      id: row.user_id,
      name: row.display_name ?? 'ユーザー',
      avatar: row.avatar_url ?? undefined,
      progress: row.completion_rate ?? 0,
      streak: row.current_day ?? 0,
      rank: idx + 1,
      level,
      completedDays: row.current_day ?? 0,
      isOnline: false,
    };
  });

  return <ChallengeParticipants challengeId={challengeId} participants={participants} />;
}
