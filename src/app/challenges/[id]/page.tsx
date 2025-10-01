import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import * as React from 'react';
import { ChallengeDetail } from '../_components/challenge-detail';
import ChallengeParticipantsServer from '../_components/challenge-participants.server';
import ChallengeProgressServer from '../_components/challenge-progress.server';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';
import type { MockChallenge } from '@/lib/mock-data';

interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengePage({ params }: ChallengePageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('challenges')
    .select('id, title, description, category, difficulty, duration, participants, current_day, progress, reward')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    notFound();
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let participation: { status: string; currentDay: number } | undefined;
  if (user) {
    const { data: participationRow } = await supabase
      .from('challenge_participations')
      .select('status, current_day')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .maybeSingle<{ status: string | null; current_day: number | null }>();

    if (participationRow) {
      participation = {
        status: participationRow.status ?? 'active',
        currentDay: participationRow.current_day ?? 0
      };
    }
  }

  const challenge: MockChallenge = {
    id: data.id,
    title: data.title,
    description: data.description ?? '',
    category: data.category ?? '',
    difficulty: (data.difficulty ?? '初級') as MockChallenge['difficulty'],
    duration: data.duration,
    currentDay: data.current_day ?? 0,
    progress: data.progress ?? 0,
    participants: data.participants ?? 0,
    reward: data.reward ?? undefined,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ChallengeDetailSkeleton />}>
            <ChallengeDetail challenge={challenge} participation={participation} />
          </Suspense>
          
          <Suspense fallback={<ChallengeProgressSkeleton />}>
            <ChallengeProgressServer challenge={challenge} />
          </Suspense>
        </div>

        <div className="lg:col-span-1">
          <Suspense fallback={<ChallengeParticipantsSkeleton />}>
            <ChallengeParticipantsServer challengeId={id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function ChallengeDetailSkeleton(): React.JSX.Element {
  return (
    <div className="bg-white rounded-lg border p-6">
      <Skeleton className="h-8 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-6" />
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

function ChallengeProgressSkeleton(): React.JSX.Element {
  return (
    <div className="bg-white rounded-lg border p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-2 w-full mb-4" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 21 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded" />
        ))}
      </div>
    </div>
  );
}

function ChallengeParticipantsSkeleton(): React.JSX.Element {
  return (
    <div className="bg-white rounded-lg border p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
