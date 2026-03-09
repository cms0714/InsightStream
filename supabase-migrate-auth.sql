-- InsightStream_ 인증 마이그레이션
-- 쿠키 기반 → Supabase Auth (이메일+비밀번호)
-- Supabase SQL Editor에서 실행하세요.

-- 1. profiles에 auth_id 컬럼 추가 (auth.users.id 참조)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- 2. 기존 데이터가 있으면 auth_id는 NULL로 유지 (새 가입자부터 적용)

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
