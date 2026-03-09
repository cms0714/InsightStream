-- InsightStream_ 검색 + 알림 마이그레이션
-- Supabase SQL Editor에서 실행하세요.

-- ============================================================
-- 1. 검색용 Full-Text Search 인덱스
-- ============================================================
-- 한국어 포함 범용 검색을 위해 trigram 확장 사용
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING GIN(content gin_trgm_ops);

-- ============================================================
-- 2. 알림 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reaction', 'comment')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);

-- ============================================================
-- 3. 알림 RLS
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    actor_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = actor_id)
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (true) WITH CHECK (true);
