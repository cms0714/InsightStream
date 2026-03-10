-- InsightStream: 이미지 업로드 마이그레이션
-- Supabase SQL Editor에서 실행하세요.

-- 1) posts 테이블에 images 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

-- 2) posts_feed 뷰 재생성 (images 포함)
DROP VIEW IF EXISTS posts_feed;
CREATE VIEW posts_feed AS
SELECT
  p.id, p.url, p.title, p.thumbnail, p.content, p.categories, p.images,
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

-- 3) Storage RLS: post-images 버킷 정책
-- 누구나 읽기 가능
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'public_read', 'post-images', 'SELECT', '(true)'
WHERE NOT EXISTS (SELECT 1 FROM storage.policies WHERE name = 'public_read' AND bucket_id = 'post-images');

-- 인증된 사용자만 업로드 가능
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'auth_upload', 'post-images', 'INSERT', '(auth.role() = ''authenticated'')'
WHERE NOT EXISTS (SELECT 1 FROM storage.policies WHERE name = 'auth_upload' AND bucket_id = 'post-images');
