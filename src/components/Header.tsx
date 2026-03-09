'use client';

import { Profile } from '@/lib/types';
import { signOut } from '@/lib/actions';
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
  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

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
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-accent-green/50 transition-colors shrink-0"
              >
                <span className="w-6 h-6 rounded-full bg-accent-green/20 text-accent-green text-xs font-bold flex items-center justify-center">
                  {profile.nickname[0]}
                </span>
                <span className="text-xs text-text-muted max-w-[80px] truncate hidden sm:inline">
                  {profile.nickname}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-36 bg-bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={onProfileEdit}
                  className="w-full text-left px-4 py-2.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-primary/50 transition-colors rounded-t-lg"
                >
                  프로필 수정
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-bg-primary/50 transition-colors rounded-b-lg border-t border-border"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
