import { createClient } from '@/lib/supabase/server';
import { ChallengeParticipants } from './challenge-participants';

type LeaderboardRow = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  fitness_level: string | null;
  current_day: number | null;
  completion_rate: number | null;
};

export default async function ChallengeParticipantsServer({ challengeId }: { challengeId: string }) {
  const supabase = await createClient();

  const { data } = await supabase.rpc<LeaderboardRow[]>('get_challenge_leaderboard', {
    target_challenge_id: challengeId,
    limit_count: 10,
  });

  const participants = (data ?? []).map((row, idx) => {
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
