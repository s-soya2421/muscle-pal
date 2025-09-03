import { Suspense } from 'react';
import * as React from 'react';
import { BadgeCollection } from './_components/badge-collection';
import { BadgeStats } from './_components/badge-stats';
import { Skeleton } from '@/components/ui/skeleton';

export default function BadgesPage(): React.JSX.Element {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">バッジコレクション</h1>
        <p className="text-gray-600">
          あなたの成長の軌跡とフィットネスでの達成を記録
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<BadgeCollectionSkeleton />}>
            <BadgeCollection />
          </Suspense>
        </div>

        <div className="lg:col-span-1">
          <Suspense fallback={<BadgeStatsSkeleton />}>
            <BadgeStats />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function BadgeCollectionSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-12 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BadgeStatsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}