'use client';

import { SortMode } from '@/lib/types';

interface SortToggleProps {
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
}

export default function SortToggle({ sort, onSortChange }: SortToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-card rounded-lg border border-border p-0.5">
      <button
        onClick={() => onSortChange('latest')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          sort === 'latest'
            ? 'bg-accent-green text-black'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        최신순
      </button>
      <button
        onClick={() => onSortChange('popular')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          sort === 'popular'
            ? 'bg-accent-green text-black'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        인기순
      </button>
    </div>
  );
}
