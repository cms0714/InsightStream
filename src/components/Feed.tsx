'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Post, Reaction } from '@/lib/types';
import { categoryLabels } from '@/lib/categories';
import { CategoryItem } from '@/lib/categories';
import { Category } from '@/lib/types';
import FeedCard from './FeedCard';

interface FeedProps {
  posts: Post[];
  bookmarkedIds: Set<string>;
  activeTab: CategoryItem['key'];
  onReact: (postId: string, type: keyof Reaction) => void;
  onBookmarkToggle: (postId: string) => void;
  onPostClick: (postId: string) => void;
  userReactions: Record<string, string[]>;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

const emptyMessages: Record<string, { title: string; sub: string }> = {
  all: { title: '아직 공유된 글이 없어요', sub: '첫 번째 인사이트를 공유해보세요!' },
  saved: { title: '저장한 글이 없어요', sub: '카드의 북마크 아이콘을 눌러보세요' },
};

export default function Feed({ posts, bookmarkedIds, activeTab, onReact, onBookmarkToggle, onPostClick, userReactions, onLoadMore, loadingMore, hasMore }: FeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onLoadMore) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect, onLoadMore]);

  if (posts.length === 0) {
    const msg = emptyMessages[activeTab] || {
      title: `${categoryLabels[activeTab as Category] || activeTab} 카테고리가 비어있어요`,
      sub: '첫 인사이트를 공유해보세요!',
    };
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-lg">{msg.title}</p>
        <p className="text-sm mt-1">{msg.sub}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {posts.map((post) => (
        <FeedCard
          key={post.id}
          post={post}
          isBookmarked={bookmarkedIds.has(post.id)}
          onReact={onReact}
          onBookmarkToggle={onBookmarkToggle}
          onPostClick={onPostClick}
          userReactions={userReactions[post.id] || []}
        />
      ))}
      {onLoadMore && (
        <div ref={sentinelRef} className="col-span-full flex justify-center py-6">
          {loadingMore && (
            <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-xs text-text-muted">모든 글을 불러왔습니다</p>
          )}
        </div>
      )}
    </div>
  );
}
