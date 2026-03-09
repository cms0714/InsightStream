'use client';

import { Profile } from '@/lib/types';

interface HeaderProps {
  profile?: Profile | null;
  onProfileEdit?: () => void;
}

export default function Header({ profile, onProfileEdit }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            InsightStream
            <span className="text-accent-green animate-pulse">_</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            공유는 가볍게, 인사이트는 묵직하게
          </p>
        </div>
        {profile && (
          <button
            onClick={onProfileEdit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-accent-green/50 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-accent-green/20 text-accent-green text-xs font-bold flex items-center justify-center">
              {profile.nickname[0]}
            </span>
            <span className="text-xs text-text-muted max-w-[80px] truncate">
              {profile.nickname}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
