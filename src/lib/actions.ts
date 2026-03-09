'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { supabase } from './supabase';
import type { Profile, Post, Comment, Category, SortMode, Notification } from './types';

const COOKIE_NAME = 'insightstream-profile-id';

export async function getProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, nickname, major')
    .eq('id', profileId)
    .single();

  return data ?? null;
}

export async function createProfile(nickname: string, major: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ nickname, major })
    .select('id, nickname, major')
    .single();

  if (error || !data) throw new Error('프로필 생성에 실패했습니다.');

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return data;
}

export async function updateProfile(
  nickname: string,
  major: string
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return { success: false, error: '프로필을 찾을 수 없습니다.' };

  const { data, error } = await supabase
    .from('profiles')
    .update({ nickname, major })
    .eq('id', profileId)
    .select('id, nickname, major')
    .single();

  if (error || !data) return { success: false, error: '프로필 수정에 실패했습니다.' };

  revalidatePath('/');
  return { success: true, profile: data };
}

function mapRowToPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    url: row.url as string,
    title: row.title as string,
    thumbnail: row.thumbnail as string,
    content: row.content as string,
    categories: (row.categories as string[]).map(c => c as Category),
    author: row.author_name as string,
    major: row.author_major as string,
    authorId: row.author_id as string,
    createdAt: row.created_at as string,
    reactions: {
      oh: Number(row.oh_count) || 0,
      amazing: Number(row.amazing_count) || 0,
      useful: Number(row.useful_count) || 0,
    },
    comments: [],
    commentCount: Number(row.comment_count) || 0,
  };
}

export async function fetchPosts(category?: string, sort: SortMode = 'latest'): Promise<Post[]> {
  let query = supabase.from('posts_feed').select('*');

  if (category && category !== 'all') {
    query = query.contains('categories', [category]);
  }

  if (sort === 'popular') {
    query = query.order('oh_count', { ascending: false })
      .order('amazing_count', { ascending: false })
      .order('useful_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error('피드를 불러오는 데 실패했습니다.');

  return (data ?? []).map(mapRowToPost);
}

export async function searchPosts(query: string): Promise<Post[]> {
  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('posts_feed')
    .select('*')
    .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},author_name.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error('검색에 실패했습니다.');

  return (data ?? []).map(mapRowToPost);
}

export async function fetchPostDetail(postId: string): Promise<{ post: Post; comments: Comment[] } | null> {
  const { data: row } = await supabase
    .from('posts_feed')
    .select('*')
    .eq('id', postId)
    .single();

  if (!row) return null;

  const { data: commentRows } = await supabase
    .from('comments')
    .select('id, text, created_at, profiles(nickname, major)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  const comments: Comment[] = (commentRows ?? []).map((c: Record<string, unknown>) => {
    const profile = c.profiles as { nickname: string; major: string } | null;
    return {
      id: c.id as string,
      author: profile?.nickname ?? '알 수 없음',
      major: profile?.major ?? '',
      text: c.text as string,
      createdAt: c.created_at as string,
    };
  });

  const post: Post = {
    id: row.id,
    url: row.url,
    title: row.title,
    thumbnail: row.thumbnail,
    content: row.content,
    categories: (row.categories as string[]).map((c: string) => c as Category),
    author: row.author_name,
    major: row.author_major,
    authorId: row.author_id,
    createdAt: row.created_at,
    reactions: {
      oh: Number(row.oh_count) || 0,
      amazing: Number(row.amazing_count) || 0,
      useful: Number(row.useful_count) || 0,
    },
    comments,
    commentCount: comments.length,
  };

  return { post, comments };
}

export async function fetchUserReactions(postIds: string[]): Promise<Record<string, string[]>> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId || postIds.length === 0) return {};

  const { data } = await supabase
    .from('reactions')
    .select('post_id, reaction_type')
    .eq('profile_id', profileId)
    .in('post_id', postIds);

  const result: Record<string, string[]> = {};
  for (const row of data ?? []) {
    if (!result[row.post_id]) result[row.post_id] = [];
    result[row.post_id].push(row.reaction_type);
  }
  return result;
}

export async function fetchBookmarkIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return [];

  const { data } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('profile_id', profileId);

  return (data ?? []).map((row: { post_id: string }) => row.post_id);
}

export async function createPost(formData: {
  url: string;
  title: string;
  thumbnail: string;
  content: string;
  categories: Category[];
}): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return { success: false, error: '프로필을 먼저 설정해주세요.' };

  const { error } = await supabase.from('posts').insert({
    url: formData.url,
    title: formData.title,
    thumbnail: formData.thumbnail,
    content: formData.content,
    categories: formData.categories,
    author_id: profileId,
  });

  if (error) return { success: false, error: '글 작성에 실패했습니다.' };

  revalidatePath('/');
  return { success: true };
}

export async function updatePost(
  postId: string,
  data: { content: string; categories: Category[] }
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return { success: false, error: '프로필을 먼저 설정해주세요.' };

  // 본인 글인지 확인
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (!post || post.author_id !== profileId) {
    return { success: false, error: '본인의 글만 수정할 수 있습니다.' };
  }

  const { error } = await supabase
    .from('posts')
    .update({ content: data.content, categories: data.categories })
    .eq('id', postId);

  if (error) return { success: false, error: '글 수정에 실패했습니다.' };

  revalidatePath('/');
  return { success: true };
}

export async function deletePost(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return { success: false, error: '프로필을 먼저 설정해주세요.' };

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (!post || post.author_id !== profileId) {
    return { success: false, error: '본인의 글만 삭제할 수 있습니다.' };
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) return { success: false, error: '글 삭제에 실패했습니다.' };

  revalidatePath('/');
  return { success: true };
}

export async function toggleReaction(
  postId: string,
  type: 'oh' | 'amazing' | 'useful'
): Promise<{ toggled: boolean; error?: string }> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return { toggled: false, error: '프로필을 먼저 설정해주세요.' };

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('profile_id', profileId)
    .eq('reaction_type', type)
    .single();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return { toggled: false };
  } else {
    await supabase.from('reactions').insert({
      post_id: postId,
      profile_id: profileId,
      reaction_type: type,
    });

    // 알림 생성 (본인 글이 아닌 경우만)
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();
    if (post && post.author_id !== profileId) {
      await supabase.from('notifications').insert({
        recipient_id: post.author_id,
        actor_id: profileId,
        post_id: postId,
        type: 'reaction',
      });
    }

    return { toggled: true };
  }
}

export async function addComment(
  postId: string,
  text: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return { success: false, error: '프로필을 먼저 설정해주세요.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, major')
    .eq('id', profileId)
    .single();

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: profileId, text })
    .select('id, created_at')
    .single();

  if (error || !data) return { success: false, error: '댓글 작성에 실패했습니다.' };

  // 알림 생성 (본인 글이 아닌 경우만)
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();
  if (post && post.author_id !== profileId) {
    await supabase.from('notifications').insert({
      recipient_id: post.author_id,
      actor_id: profileId,
      post_id: postId,
      type: 'comment',
    });
  }

  return {
    success: true,
    comment: {
      id: data.id,
      author: profile?.nickname ?? '',
      major: profile?.major ?? '',
      text,
      createdAt: data.created_at,
    },
  };
}

export async function toggleBookmark(
  postId: string
): Promise<{ bookmarked: boolean; error?: string }> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return { bookmarked: false, error: '프로필을 먼저 설정해주세요.' };

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('profile_id', profileId)
    .single();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    return { bookmarked: false };
  } else {
    await supabase.from('bookmarks').insert({
      post_id: postId,
      profile_id: profileId,
    });
    return { bookmarked: true };
  }
}

export async function fetchNotifications(): Promise<Notification[]> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, read, created_at, post_id, posts(title), profiles!notifications_actor_id_fkey(nickname)')
    .eq('recipient_id', profileId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => {
    const actor = row.profiles as { nickname: string } | null;
    const post = row.posts as { title: string } | null;
    return {
      id: row.id as string,
      type: row.type as 'reaction' | 'comment',
      actorName: actor?.nickname ?? '알 수 없음',
      postId: row.post_id as string,
      postTitle: post?.title ?? '',
      read: row.read as boolean,
      createdAt: row.created_at as string,
    };
  });
}

export async function markNotificationsRead(): Promise<void> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(COOKIE_NAME)?.value;
  if (!profileId) return;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', profileId)
    .eq('read', false);
}
