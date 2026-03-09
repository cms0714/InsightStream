'use client';

import { useState, useCallback, useTransition } from 'react';
import { Post, Category, Reaction, Profile } from '@/lib/types';
import { CategoryItem } from '@/lib/categories';
import {
  createPost,
  updatePost,
  deletePost,
  toggleReaction,
  toggleBookmark,
  addComment,
  fetchPostDetail,
} from '@/lib/actions';
import { useToast } from '@/lib/toast-context';
import Header from './Header';
import FilterTabs from './FilterTabs';
import PostForm from './PostForm';
import Feed from './Feed';
import PostDetail from './PostDetail';
import ProfileSetup from './ProfileSetup';

interface MainFeedProps {
  initialPosts: Post[];
  profile: Profile | null;
  initialBookmarkIds: string[];
  userReactions: Record<string, string[]>;
}

export default function MainFeed({
  initialPosts,
  profile: initialProfile,
  initialBookmarkIds,
  userReactions: initialUserReactions,
}: MainFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<CategoryItem['key']>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(initialBookmarkIds)
  );
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>(
    initialUserReactions
  );
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostData, setSelectedPostData] = useState<Post | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [showProfileSetup, setShowProfileSetup] = useState(!initialProfile);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleProfileComplete = useCallback(() => {
    setShowProfileSetup(false);
    window.location.reload();
  }, []);

  const handleProfileEdit = useCallback((updatedProfile?: Profile) => {
    if (updatedProfile) {
      setProfile(updatedProfile);
      showToast('프로필이 수정되었습니다!');
    }
    setShowProfileEdit(false);
  }, [showToast]);

  const handleAddPost = async (data: {
    url: string;
    title: string;
    thumbnail: string;
    content: string;
    categories: Category[];
  }) => {
    if (!profile) return;

    const optimisticPost: Post = {
      id: 'temp-' + Date.now(),
      url: data.url,
      title: data.title,
      thumbnail: data.thumbnail,
      content: data.content,
      categories: data.categories,
      author: profile.nickname,
      major: profile.major,
      authorId: profile.id,
      createdAt: new Date().toISOString(),
      reactions: { oh: 0, amazing: 0, useful: 0 },
      comments: [],
      commentCount: 0,
    };
    setPosts((prev) => [optimisticPost, ...prev]);

    const result = await createPost(data);
    if (!result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== optimisticPost.id));
      showToast(result.error || '글 작성에 실패했습니다.', 'error');
      return;
    }

    showToast('인사이트가 공유되었습니다!');
    startTransition(() => {
      window.location.reload();
    });
  };

  const handleEditPost = async (postId: string, data: { content: string; categories: Category[] }) => {
    // Optimistic update
    const prevPosts = posts;
    const prevDetailData = selectedPostData;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, content: data.content, categories: data.categories } : p
      )
    );
    if (selectedPostData?.id === postId) {
      setSelectedPostData((prev) =>
        prev ? { ...prev, content: data.content, categories: data.categories } : prev
      );
    }

    const result = await updatePost(postId, data);
    if (!result.success) {
      setPosts(prevPosts);
      setSelectedPostData(prevDetailData);
      showToast(result.error || '글 수정에 실패했습니다.', 'error');
      return;
    }

    showToast('글이 수정되었습니다!');
  };

  const handleDeletePost = async (postId: string) => {
    const result = await deletePost(postId);
    if (!result.success) {
      showToast(result.error || '글 삭제에 실패했습니다.', 'error');
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    handleCloseDetail();
    showToast('글이 삭제되었습니다.');
  };

  const handleReact = async (postId: string, type: keyof Reaction) => {
    if (!profile) return;

    const currentReactions = userReactions[postId] || [];
    const alreadyReacted = currentReactions.includes(type);

    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [type]: post.reactions[type] + (alreadyReacted ? -1 : 1),
              },
            }
          : post
      )
    );
    setUserReactions((prev) => ({
      ...prev,
      [postId]: alreadyReacted
        ? currentReactions.filter((r) => r !== type)
        : [...currentReactions, type],
    }));

    // Also update detail view if open
    if (selectedPostData?.id === postId) {
      setSelectedPostData((prev) =>
        prev
          ? {
              ...prev,
              reactions: {
                ...prev.reactions,
                [type]: prev.reactions[type] + (alreadyReacted ? -1 : 1),
              },
            }
          : prev
      );
    }

    const result = await toggleReaction(postId, type);
    if (result.error) {
      // Rollback
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                reactions: {
                  ...post.reactions,
                  [type]: post.reactions[type] + (alreadyReacted ? 1 : -1),
                },
              }
            : post
        )
      );
      setUserReactions((prev) => ({
        ...prev,
        [postId]: currentReactions,
      }));
      showToast(result.error, 'error');
    }
  };

  const handleBookmarkToggle = async (postId: string) => {
    if (!profile) return;

    const wasBookmarked = bookmarkedIds.has(postId);

    // Optimistic update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(postId);
      else next.add(postId);
      return next;
    });

    const result = await toggleBookmark(postId);
    if (result.error) {
      // Rollback
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      showToast(result.error, 'error');
    }
  };

  const handlePostClick = async (postId: string) => {
    setSelectedPostId(postId);
    setDetailLoading(true);

    const result = await fetchPostDetail(postId);
    if (result) {
      setSelectedPostData(result.post);
    } else {
      const fallback = posts.find((p) => p.id === postId);
      if (fallback) setSelectedPostData(fallback);
    }
    setDetailLoading(false);
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!profile) return;

    const result = await addComment(postId, text);
    if (result.success && result.comment) {
      setSelectedPostData((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, result.comment!],
              commentCount: prev.commentCount + 1,
            }
          : prev
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      );
      showToast('댓글이 작성되었습니다!');
    } else {
      showToast(result.error || '댓글 작성에 실패했습니다.', 'error');
    }
  };

  const handleCloseDetail = () => {
    setSelectedPostId(null);
    setSelectedPostData(null);
  };

  const filteredPosts = (() => {
    if (activeTab === 'all') return posts;
    if (activeTab === 'saved') return posts.filter((p) => bookmarkedIds.has(p.id));
    return posts.filter((p) => p.categories.includes(activeTab as Category));
  })();

  return (
    <>
      {showProfileSetup && <ProfileSetup onComplete={handleProfileComplete} />}
      {showProfileEdit && profile && (
        <ProfileSetup
          profile={profile}
          onComplete={handleProfileEdit}
          onClose={() => setShowProfileEdit(false)}
        />
      )}
      <Header profile={profile} onProfileEdit={() => setShowProfileEdit(true)} />
      <FilterTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showSaved={bookmarkedIds.size > 0}
      />
      {profile && <PostForm onSubmit={handleAddPost} />}
      <Feed
        posts={filteredPosts}
        bookmarkedIds={bookmarkedIds}
        activeTab={activeTab}
        onReact={handleReact}
        onBookmarkToggle={handleBookmarkToggle}
        onPostClick={handlePostClick}
        userReactions={userReactions}
      />
      {selectedPostId && (
        <PostDetail
          post={selectedPostData}
          loading={detailLoading}
          onClose={handleCloseDetail}
          onReact={handleReact}
          onAddComment={handleAddComment}
          userReactions={userReactions[selectedPostId] || []}
          profileId={profile?.id}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
        />
      )}
    </>
  );
}
