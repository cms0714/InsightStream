'use client';

import { Post, Reaction } from '@/lib/types';
import { categoryLabels } from '@/lib/categories';
import ReactionBar from './ReactionBar';
import BookmarkButton from './BookmarkButton';

interface FeedCardProps {
  post: Post;
  isBookmarked: boolean;
  onReact: (postId: string, type: keyof Reaction) => void;
  onBookmarkToggle: (postId: string) => void;
  onPostClick: (postId: string) => void;
  userReactions: string[];
}

export default function FeedCard({ post, isBookmarked, onReact, onBookmarkToggle, onPostClick, userReactions }: FeedCardProps) {
  return (
    <article
      className="bg-bg-card rounded-xl border border-border overflow-hidden hover:border-accent-green/30 transition-colors cursor-pointer"
      onClick={() => onPostClick(post.id)}
    >
      {post.thumbnail && (
        <img
          src={post.thumbnail}
          alt={post.title}
          className="w-full h-40 object-cover"
        />
      )}
      {post.images && post.images.length > 0 && !post.thumbnail && (
        <img
          src={post.images[0]}
          alt=""
          className="w-full h-40 object-cover"
        />
      )}
      {post.images && post.images.length > 1 && (
        <div className="flex gap-1 px-4 pt-2">
          {post.images.slice(post.thumbnail ? 0 : 1, 4).map((img, i) => (
            <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
          ))}
          {post.images.length > 4 && (
            <span className="w-16 h-16 rounded-lg border border-border bg-bg-primary flex items-center justify-center text-xs text-text-muted">
              +{post.images.length - 4}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 flex-1">
            {post.title}
          </h3>
          <div onClick={(e) => e.stopPropagation()}>
            <BookmarkButton
              postId={post.id}
              isBookmarked={isBookmarked}
              onToggle={onBookmarkToggle}
            />
          </div>
        </div>
        <p className="text-sm text-text-muted mb-3 line-clamp-2">{post.content}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {post.categories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-green/15 text-accent-green"
              >
                {categoryLabels[cat]}
              </span>
            ))}
            <span className="text-xs text-text-muted">
              @{post.major} {post.author}
            </span>
          </div>
          {post.commentCount > 0 && (
            <span className="text-xs text-text-muted">
              💬 {post.commentCount}
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ReactionBar
            reactions={post.reactions}
            onReact={(type) => onReact(post.id, type)}
            userReactions={userReactions}
          />
        </div>
      </div>
    </article>
  );
}
