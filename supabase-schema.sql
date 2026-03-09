-- InsightStream_ Supabase Schema
-- Supabase SQL Editor에서 이 파일을 먼저 실행한 후, supabase-rls.sql을 실행하세요.

-- 프로필 (닉네임+전공, UUID 쿠키로 식별)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  major TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 게시물
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  thumbnail TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT posts_categories_check CHECK (categories <@ ARRAY['robotics','ai','cheme','future','cs','math','physics','bio','econ','design']::TEXT[]),
  CONSTRAINT posts_categories_nonempty CHECK (array_length(categories, 1) > 0)
);

-- 댓글
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 리액션 (유저당 타입당 1번 — 토글 방식)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('oh','amazing','useful')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, profile_id, reaction_type)
);

-- 북마크 (유저당 게시물당 1번)
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, profile_id)
);

-- 피드 조회용 뷰
CREATE VIEW posts_feed AS
SELECT
  p.id, p.url, p.title, p.thumbnail, p.content, p.categories,
  p.author_id, p.created_at,
  pr.nickname AS author_name, pr.major AS author_major,
  COUNT(DISTINCT CASE WHEN r.reaction_type='oh' THEN r.id END) AS oh_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type='amazing' THEN r.id END) AS amazing_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type='useful' THEN r.id END) AS useful_count,
  COUNT(DISTINCT c.id) AS comment_count
FROM posts p
JOIN profiles pr ON p.author_id = pr.id
LEFT JOIN reactions r ON r.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, pr.nickname, pr.major;

-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reaction', 'comment')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_posts_categories ON posts USING GIN(categories);
CREATE INDEX idx_posts_title_trgm ON posts USING GIN(title gin_trgm_ops);
CREATE INDEX idx_posts_content_trgm ON posts USING GIN(content gin_trgm_ops);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_reactions_post ON reactions(post_id);
CREATE INDEX idx_bookmarks_profile ON bookmarks(profile_id);
