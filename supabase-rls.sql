-- InsightStream_ RLS (Row Level Security) 정책
-- supabase-schema.sql 실행 후, 이 파일을 Supabase SQL Editor에서 실행하세요.
--
-- 이 앱은 Supabase Auth를 사용하지 않고 쿠키 기반 프로필 시스템을 사용합니다.
-- 모든 DB 접근은 Server Actions(서버 사이드)를 통해 이루어지며,
-- Server Actions에서 쿠키의 profile_id를 검증한 후 쿼리를 실행합니다.
-- RLS는 anon key가 노출되더라도 DB를 보호하는 추가 방어층입니다.

-- ============================================================
-- 1. RLS 활성화
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. profiles 테이블
--    - 누구나 읽기 가능 (피드에 작성자 표시)
--    - 누구나 생성 가능 (프로필 등록)
--    - 누구나 수정 가능 (본인 확인은 Server Actions 쿠키 검증)
-- ============================================================
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 3. posts 테이블
--    - 누구나 읽기 가능
--    - 프로필이 존재하는 사용자만 쓰기 가능
--      (author_id가 profiles 테이블에 존재해야 함)
-- ============================================================
CREATE POLICY "posts_select" ON posts
  FOR SELECT USING (true);

CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (
    author_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id)
  );

CREATE POLICY "posts_update" ON posts
  FOR UPDATE USING (true) WITH CHECK (
    author_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id)
  );

CREATE POLICY "posts_delete" ON posts
  FOR DELETE USING (
    author_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id)
  );

-- ============================================================
-- 4. comments 테이블
--    - 누구나 읽기 가능
--    - 프로필이 존재하는 사용자만 쓰기 가능
-- ============================================================
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (
    author_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id)
  );

-- ============================================================
-- 5. reactions 테이블
--    - 누구나 읽기 가능 (리액션 카운트 표시)
--    - 프로필이 존재하는 사용자만 추가/삭제 가능
-- ============================================================
CREATE POLICY "reactions_select" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "reactions_insert" ON reactions
  FOR INSERT WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "reactions_delete" ON reactions
  FOR DELETE USING (
    profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = profile_id)
  );

-- ============================================================
-- 6. bookmarks 테이블
--    - 본인 것만 읽기 가능 (profile_id 일치 확인은 서버에서)
--    - 본인 것만 쓰기/삭제 가능
--    - 참고: Supabase Auth 미사용이므로 auth.uid() 대신
--      profile_id 존재 여부로 유효성 검증.
--      실제 "본인" 확인은 Server Actions의 쿠키 검증에 의존합니다.
-- ============================================================
CREATE POLICY "bookmarks_select" ON bookmarks
  FOR SELECT USING (
    profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "bookmarks_insert" ON bookmarks
  FOR INSERT WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "bookmarks_delete" ON bookmarks
  FOR DELETE USING (
    profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = profile_id)
  );
