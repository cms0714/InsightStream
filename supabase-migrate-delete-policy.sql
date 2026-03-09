-- InsightStream_ 글 삭제 RLS 정책 추가
-- Supabase SQL Editor에서 실행하세요.
-- (supabase-migrate-categories.sql 실행 후)

CREATE POLICY "posts_delete" ON posts
  FOR DELETE USING (
    author_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id)
  );
