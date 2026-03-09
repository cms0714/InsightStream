'use client';

import { Reaction } from '@/lib/types';

interface ReactionBarProps {
  reactions: Reaction;
  onReact: (type: keyof Reaction) => void;
  userReactions?: string[];
}

const reactionConfig: { key: keyof Reaction; emoji: string; label: string }[] = [
  { key: 'oh', emoji: '👀', label: '오..' },
  { key: 'amazing', emoji: '🤯', label: '대박' },
  { key: 'useful', emoji: '📚', label: '유익함' },
];

export default function ReactionBar({ reactions, onReact, userReactions = [] }: ReactionBarProps) {
  return (
    <div className="flex gap-2">
      {reactionConfig.map(({ key, emoji, label }) => {
        const isActive = userReactions.includes(key);
        return (
          <button
            key={key}
            onClick={() => onReact(key)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
              isActive
                ? 'bg-accent-green/20 border border-accent-green text-accent-green'
                : 'bg-bg-primary border border-border text-text-muted hover:border-accent-green hover:text-text-primary'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            {reactions[key] > 0 && (
              <span className={`font-medium ${isActive ? 'text-accent-green' : 'text-accent-green'}`}>
                {reactions[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
