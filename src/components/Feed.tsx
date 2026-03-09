'use client';

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
}

const emptyMessages: Record<string, { title: string; sub: string }> = {
  all: { title: '아직 공유된 글이 없어요', sub: '첫 번째 인사이트를 공유해보세요!' },
  saved: { title: '저장한 글이 없어요', sub: '카드의 북마크 아이콘을 눌러보세요' },
};

export default function Feed({ posts, bookmarkedIds, activeTab, onReact, onBookmarkToggle, onPostClick, userReactions }: FeedProps) {
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
    </div>
  );
}
