'use client';

import { Profile } from '@/lib/types';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  profile?: Profile | null;
  onProfileEdit?: () => void;
  onSearch: (query: string) => void;
  onSearchClear: () => void;
  onPostClick: (postId: string) => void;
}

export default function Header({ profile, onProfileEdit, onSearch, onSearchClear, onPostClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">
            InsightStream
            <span className="text-accent-green animate-pulse">_</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            공유는 가볍게, 인사이트는 묵직하게
          </p>
        </div>
        <div className="flex items-center gap-1">
          <SearchBar onSearch={onSearch} onClear={onSearchClear} />
          {profile && <NotificationBell onPostClick={onPostClick} />}
          {profile && (
            <button
              onClick={onProfileEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-accent-green/50 transition-colors shrink-0"
            >
              <span className="w-6 h-6 rounded-full bg-accent-green/20 text-accent-green text-xs font-bold flex items-center justify-center">
                {profile.nickname[0]}
              </span>
              <span className="text-xs text-text-muted max-w-[80px] truncate hidden sm:inline">
                {profile.nickname}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
