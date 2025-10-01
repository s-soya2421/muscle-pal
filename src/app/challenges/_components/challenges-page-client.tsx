"use client";

import { useState } from 'react';
import * as React from 'react';
import { ChallengesFilters } from './challenges-filters';
import { ChallengesList, type ChallengeParticipationSummary } from './challenges-list';
import type { MockChallenge } from '@/lib/mock-data';
import type { ExclusiveChallenge } from '@/types/badges';

type ChallengeFilters = {
  search: string;
  category: string;
  difficulty: string;
};

interface ChallengesPageClientProps {
  challenges: MockChallenge[];
  exclusiveChallenges?: ExclusiveChallenge[];
  lockedChallenges?: ExclusiveChallenge[];
  userParticipations?: ChallengeParticipationSummary[];
}

const defaultFilters: ChallengeFilters = {
  search: '',
  category: '',
  difficulty: ''
};

export function ChallengesPageClient({
  challenges,
  exclusiveChallenges,
  lockedChallenges,
  userParticipations
}: ChallengesPageClientProps): React.JSX.Element {
  const [filters, setFilters] = useState<ChallengeFilters>(defaultFilters);

  const handleFilterChange = (next: ChallengeFilters): void => {
    setFilters(next);
  };

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
          <ChallengesFilters onFilterChange={handleFilterChange} />
        </aside>

        <main className="lg:col-span-3">
          <ChallengesList
            filter={filters.search}
            category={filters.category}
            difficulty={filters.difficulty}
            challenges={challenges}
            exclusiveChallenges={exclusiveChallenges}
            lockedChallenges={lockedChallenges}
            userParticipations={userParticipations}
          />
        </main>
      </div>
    </div>
  );
}
