import { createClient } from '@/lib/supabase/server';
import { ChallengeParticipants } from './challenge-participants';

export default async function ChallengeParticipantsServer({ challengeId }: { challengeId: string }) {
  const supabase = await createClient();

  const { data } = await supabase.rpc('get_challenge_leaderboard', {
    target_challenge_id: challengeId,
    limit_count: 10,
  });

  const participants = (data ?? []).map((row, idx) => {
    const fitnessLevel = (row as any).fitness_level as string | null;
    const level = fitnessLevel === 'advanced' ? '上級者' : fitnessLevel === 'intermediate' ? '中級者' : '初心者';
    return {
      id: (row as any).user_id as string,
      name: ((row as any).display_name as string | null) || 'ユーザー',
      avatar: ((row as any).avatar_url as string | null) || undefined,
      progress: (row as any).completion_rate ?? 0,
      streak: (row as any).current_day ?? 0,
      rank: idx + 1,
      level,
      completedDays: (row as any).current_day ?? 0,
      isOnline: false,
    };
  });

  return <ChallengeParticipants challengeId={challengeId} participants={participants} />;
}
