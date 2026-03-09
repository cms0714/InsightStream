-- InsightStream_ 카테고리 마이그레이션
-- category (단일 TEXT) → categories (TEXT 배열)로 변환
-- Supabase SQL Editor에서 실행하세요.

-- 1. 기존 뷰 삭제 (category 컬럼 참조 중)
DROP VIEW IF EXISTS posts_feed;

-- 2. categories 배열 컬럼 추가 + 기존 데이터 마이그레이션
ALTER TABLE posts ADD COLUMN categories TEXT[] NOT NULL DEFAULT '{}';
UPDATE posts SET categories = ARRAY[category];

-- 3. 기존 category 단일 컬럼 삭제
ALTER TABLE posts DROP COLUMN category;

-- 4. 유효 카테고리 제약조건
ALTER TABLE posts ADD CONSTRAINT posts_categories_check
  CHECK (categories <@ ARRAY['robotics','ai','cheme','future','cs','math','physics','bio','econ','design']::TEXT[]);

ALTER TABLE posts ADD CONSTRAINT posts_categories_nonempty
  CHECK (array_length(categories, 1) > 0);

-- 5. 피드 뷰 재생성 (categories 배열 사용)
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

-- 6. 인덱스 교체 (B-tree → GIN for array)
DROP INDEX IF EXISTS idx_posts_category;
CREATE INDEX idx_posts_categories ON posts USING GIN(categories);

-- 7. RLS: 글 수정 정책 추가
CREATE POLICY "posts_update" ON posts
  FOR UPDATE USING (true) WITH CHECK (
    author_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id)
  );
