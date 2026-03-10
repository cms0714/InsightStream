'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post, Reaction, Category } from '@/lib/types';
import { categories, categoryLabels } from '@/lib/categories';
import ReactionBar from './ReactionBar';

interface PostDetailProps {
  post: Post | null;
  loading: boolean;
  onClose: () => void;
  onReact: (postId: string, type: keyof Reaction) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  userReactions: string[];
  profileId?: string;
  onEditPost?: (postId: string, data: { content: string; categories: Category[] }) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function PostDetail({ post, loading, onClose, onReact, onAddComment, userReactions, profileId, onEditPost, onDeletePost }: PostDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editCategories, setEditCategories] = useState<Category[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = post && profileId && post.authorId === profileId;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    },
    [onClose, isEditing]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const startEditing = () => {
    if (!post) return;
    setEditContent(post.content);
    setEditCategories([...post.categories]);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!post || !onEditPost || editCategories.length === 0 || editSaving) return;
    setEditSaving(true);
    try {
      await onEditPost(post.id, { content: editContent, categories: editCategories });
      setIsEditing(false);
    } finally {
      setEditSaving(false);
    }
  };

  const toggleEditCategory = (cat: Category) => {
    setEditCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post || commentLoading) return;
    setCommentLoading(true);
    await onAddComment(post.id, commentText.trim());
    setCommentText('');
    setCommentLoading(false);
  };

  const youtubeId = post ? extractYouTubeId(post.url) : null;
  const categoryOptions = categories.filter((c) => c.key !== 'all' && c.key !== 'saved');

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-bg-card border border-border rounded-xl my-8 mx-4 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            &larr; 뒤로
          </button>
          {isOwner && !isEditing && (
            <div className="flex items-center gap-2">
              {onEditPost && (
                <button
                  onClick={startEditing}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-accent-green border border-accent-green/30 hover:bg-accent-green/10 transition-colors"
                >
                  수정
                </button>
              )}
              {onDeletePost && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                >
                  삭제
                </button>
              )}
            </div>
          )}
        </div>

        {loading || !post ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div className="mx-4 mt-4 p-4 rounded-lg border border-red-400/30 bg-red-400/5">
                <p className="text-sm text-text-primary mb-3">이 글을 정말 삭제하시겠어요?</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={async () => {
                      if (!post || !onDeletePost || deleting) return;
                      setDeleting(true);
                      await onDeletePost(post.id);
                    }}
                    disabled={deleting}
                    className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* Author info */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-text-primary">
                  @{post.major} {post.author}
                </span>
                {(isEditing ? editCategories : post.categories).map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-green/15 text-accent-green"
                  >
                    {categoryLabels[cat]}
                  </span>
                ))}
                <span className="text-xs text-text-muted">&middot; {formatDate(post.createdAt)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-3">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green resize-none"
                  />
                  <div>
                    <p className="text-xs text-text-muted mb-2">카테고리 수정</p>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((c) => {
                        const isSelected = editCategories.includes(c.key as Category);
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => toggleEditCategory(c.key as Category)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-accent-green text-black'
                                : 'bg-bg-primary border border-border text-text-muted hover:border-accent-green/50'
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                    {editCategories.length === 0 && (
                      <p className="text-xs text-red-400 mt-1.5">카테고리를 1개 이상 선택해주세요</p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleSaveEdit}
                      disabled={editSaving || editCategories.length === 0 || !editContent.trim()}
                      className="px-4 py-1.5 rounded-lg bg-accent-green text-black text-xs font-semibold hover:bg-accent-green/80 transition-colors disabled:opacity-50"
                    >
                      {editSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text-primary transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              )}
            </div>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="px-4 pb-3">
                <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {post.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img}
                        alt=""
                        className="w-full rounded-lg border border-border object-cover max-h-72 hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Media embed */}
            {post.url && <div className="px-4 pb-3">
              {youtubeId ? (
                <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={post.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 p-3 rounded-lg bg-bg-primary border border-border hover:border-accent-green/30 transition-colors"
                >
                  {post.thumbnail && (
                    <img src={post.thumbnail} alt="" className="w-20 h-14 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary line-clamp-2">{post.title}</p>
                    <p className="text-xs text-accent-green mt-1 truncate">{post.url}</p>
                  </div>
                </a>
              )}
            </div>}

            {/* Reactions */}
            <div className="px-4 pb-3">
              <ReactionBar
                reactions={post.reactions}
                onReact={(type) => onReact(post.id, type)}
                userReactions={userReactions}
              />
            </div>

            {/* Comments section */}
            <div className="px-4 py-3 border-t border-border">
              <p className="text-sm font-semibold text-text-primary mb-3">
                댓글 {post.comments.length}개
              </p>
              <div className="space-y-3">
                {post.comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-bg-primary border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-text-primary">
                        @{c.major} {c.author}
                      </span>
                      <span className="text-xs text-text-muted">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-text-muted">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment form */}
            <form
              onSubmit={handleSubmitComment}
              className="px-4 py-3 border-t border-border"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="댓글을 입력하세요..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
                  required
                />
                <button
                  type="submit"
                  disabled={commentLoading}
                  className="px-4 py-2 rounded-lg bg-accent-green text-black text-sm font-semibold hover:bg-accent-green/80 transition-colors disabled:opacity-50"
                >
                  {commentLoading ? '...' : '작성'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
