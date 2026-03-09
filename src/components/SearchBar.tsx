'use client';

import { useState, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      onClear();
      return;
    }

    debounceRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    onClear();
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="p-2 rounded-lg text-text-muted hover:text-accent-green transition-colors"
        aria-label="검색"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="제목, 내용, 작성자 검색..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
        />
      </div>
      <button
        onClick={handleClose}
        className="text-xs text-text-muted hover:text-text-primary transition-colors shrink-0"
      >
        취소
      </button>
    </div>
  );
}
