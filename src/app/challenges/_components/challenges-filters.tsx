'use client';

import { useState } from 'react';
import * as React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';

interface ChallengesFiltersProps {
  onFilterChange?: (filters: {
    search: string;
    category: string;
    difficulty: string;
  }) => void;
}

export function ChallengesFilters({ onFilterChange }: ChallengesFiltersProps): React.JSX.Element {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty: ''
  });

  const categories = ['体幹強化', '習慣化', '有酸素運動', '筋力トレーニング', '柔軟性'];
  const difficulties = ['初級', '中級', '上級'];

  const handleFilterChange = (key: string, value: string): void => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilter = (key: string): void => {
    handleFilterChange(key, '');
  };

  const clearAllFilters = (): void => {
    const newFilters = { search: '', category: '', difficulty: '' };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const hasActiveFilters = filters.search || filters.category || filters.difficulty;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              フィルター
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                クリア
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 検索 */}
          <div className="space-y-2">
            <Label htmlFor="search">検索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="チャレンジを検索..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
              {filters.search && (
                <button
                  onClick={() => clearFilter('search')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* カテゴリー */}
          <div className="space-y-3">
            <Label>カテゴリー</Label>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center justify-between">
                  <button
                    onClick={() => handleFilterChange('category', 
                      filters.category === category ? '' : category
                    )}
                    className={`text-sm text-left hover:text-blue-600 transition-colors ${
                      filters.category === category 
                        ? 'text-blue-600 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                  {filters.category === category && (
                    <Badge variant="secondary" className="text-xs">
                      選択中
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 難易度 */}
          <div className="space-y-3">
            <Label>難易度</Label>
            <div className="space-y-2">
              {difficulties.map((difficulty) => (
                <div key={difficulty} className="flex items-center justify-between">
                  <button
                    onClick={() => handleFilterChange('difficulty', 
                      filters.difficulty === difficulty ? '' : difficulty
                    )}
                    className={`text-sm text-left hover:text-blue-600 transition-colors ${
                      filters.difficulty === difficulty 
                        ? 'text-blue-600 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {difficulty}
                  </button>
                  {filters.difficulty === difficulty && (
                    <Badge variant="secondary" className="text-xs">
                      選択中
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium text-gray-700">アクティブなフィルター</h4>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="outline" className="flex items-center gap-1">
                  "{filters.search}"
                  <button onClick={() => clearFilter('search')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {filters.category}
                  <button onClick={() => clearFilter('category')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.difficulty && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {filters.difficulty}
                  <button onClick={() => clearFilter('difficulty')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}