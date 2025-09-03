import { Suspense } from 'react';
import * as React from 'react';
import { ChallengesList } from './_components/challenges-list';
import { ChallengesFilters } from './_components/challenges-filters';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChallengesPage(): React.JSX.Element {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">チャレンジ</h1>
        <p className="text-gray-600">
          仲間と一緒に目標を達成し、新しい習慣を身につけよう
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <ChallengesFilters />
        </aside>

        <main className="lg:col-span-3">
          <Suspense fallback={<ChallengesListSkeleton />}>
            <ChallengesList />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function ChallengesListSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full mb-2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}