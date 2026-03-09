'use client';

import { categories, CategoryItem } from '@/lib/categories';

interface FilterTabsProps {
  activeTab: CategoryItem['key'];
  onTabChange: (tab: CategoryItem['key']) => void;
  showSaved?: boolean;
}

export default function FilterTabs({ activeTab, onTabChange, showSaved }: FilterTabsProps) {
  const tabs = showSaved
    ? [...categories, { key: 'saved' as const, label: '저장됨' }]
    : categories;

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-3 border-b border-border">
      {tabs.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onTabChange(cat.key)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTab === cat.key
              ? 'bg-accent-green text-black'
              : 'bg-bg-card text-text-muted hover:text-text-primary'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
