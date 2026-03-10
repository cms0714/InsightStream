'use client';

import { useState, useCallback, useTransition } from 'react';
import { Post, Category, Reaction, Profile, SortMode } from '@/lib/types';
import { CategoryItem } from '@/lib/categories';
import {
  createPost,
  updatePost,
  deletePost,
  toggleReaction,
  toggleBookmark,
  addComment,
  fetchPostDetail,
  searchPosts,
} from '@/lib/actions';
import { useToast } from '@/lib/toast-context';
import Header from './Header';
import FilterTabs from './FilterTabs';
import PostForm from './PostForm';
import Feed from './Feed';
import PostDetail from './PostDetail';
import AuthForm from './AuthForm';
import ProfileSetup from './ProfileSetup';
import SortToggle from './SortToggle';

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
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
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
  const [showAuth, setShowAuth] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleAuthComplete = useCallback(() => {
    setShowAuth(false);
    window.location.reload();
  }, []);

  const handleProfileEdit = useCallback((updatedProfile?: Profile) => {
    if (updatedProfile) {
      setProfile(updatedProfile);
      showToast('프로필이 수정되었습니다!');
    }
    setShowProfileEdit(false);
  }, [showToast]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    try {
      const results = await searchPosts(query);
      setSearchResults(results);
    } catch {
      showToast('검색에 실패했습니다.', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleAddPost = async (data: {
    url: string;
    title: string;
    thumbnail: string;
    content: string;
    categories: Category[];
    images?: string[];
  }) => {
    if (!profile) {
      setShowAuth(true);
      return;
    }

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
      images: data.images ?? [],
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
    if (!profile) {
      setShowAuth(true);
      return;
    }

    const currentReactions = userReactions[postId] || [];
    const alreadyReacted = currentReactions.includes(type);

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
    if (!profile) {
      setShowAuth(true);
      return;
    }

    const wasBookmarked = bookmarkedIds.has(postId);

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(postId);
      else next.add(postId);
      return next;
    });

    const result = await toggleBookmark(postId);
    if (result.error) {
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
      const allPosts = searchResults ?? posts;
      const fallback = allPosts.find((p) => p.id === postId);
      if (fallback) setSelectedPostData(fallback);
    }
    setDetailLoading(false);
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!profile) {
      setShowAuth(true);
      return;
    }

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

  const displayPosts = (() => {
    if (searchResults !== null) return searchResults;

    let filtered = posts;
    if (activeTab === 'saved') {
      filtered = posts.filter((p) => bookmarkedIds.has(p.id));
    } else if (activeTab !== 'all') {
      filtered = posts.filter((p) => p.categories.includes(activeTab as Category));
    }

    if (sortMode === 'popular') {
      return [...filtered].sort((a, b) => {
        const scoreA = a.reactions.oh + a.reactions.amazing + a.reactions.useful;
        const scoreB = b.reactions.oh + b.reactions.amazing + b.reactions.useful;
        return scoreB - scoreA;
      });
    }

    return filtered;
  })();

  const isSearching = searchResults !== null;

  return (
    <>
      {showAuth && <AuthForm onComplete={handleAuthComplete} />}
      {showProfileEdit && profile && (
        <ProfileSetup
          profile={profile}
          onComplete={handleProfileEdit}
          onClose={() => setShowProfileEdit(false)}
        />
      )}
      <Header
        profile={profile}
        onProfileEdit={() => setShowProfileEdit(true)}
        onSearch={handleSearch}
        onSearchClear={handleSearchClear}
        onPostClick={handlePostClick}
      />
      {!isSearching && (
        <FilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showSaved={bookmarkedIds.size > 0}
        />
      )}
      {isSearching ? (
        <div className="px-4 pt-3 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            {searchLoading ? '검색 중...' : `"${searchQuery}" 검색 결과 ${searchResults.length}건`}
          </p>
        </div>
      ) : (
        <div className="px-4 pt-3 flex items-center justify-between">
          <SortToggle sort={sortMode} onSortChange={setSortMode} />
          {!profile && (
            <button
              onClick={() => setShowAuth(true)}
              className="px-4 py-1.5 rounded-lg bg-accent-green text-black text-xs font-semibold hover:bg-accent-green/80 transition-colors"
            >
              로그인
            </button>
          )}
        </div>
      )}
      {!profile && !isSearching && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl border border-accent-green/20 bg-accent-green/5 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            로그인하면 인사이트를 공유할 수 있어요
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="shrink-0 px-4 py-1.5 rounded-lg bg-accent-green text-black text-xs font-semibold hover:bg-accent-green/80 transition-colors"
          >
            시작하기
          </button>
        </div>
      )}
      {profile && !isSearching && <PostForm onSubmit={handleAddPost} />}
      <Feed
        posts={displayPosts}
        bookmarkedIds={bookmarkedIds}
        activeTab={isSearching ? 'all' : activeTab}
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
