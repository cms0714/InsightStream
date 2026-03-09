'use client';

import { useState } from 'react';
import { Profile } from '@/lib/types';
import { createProfile, updateProfile } from '@/lib/actions';

interface ProfileSetupProps {
  profile?: Profile | null;
  onComplete: (profile?: Profile) => void;
  onClose?: () => void;
}

export default function ProfileSetup({ profile, onComplete, onClose }: ProfileSetupProps) {
  const isEdit = !!profile;
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [major, setMajor] = useState(profile?.major ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !major.trim()) return;

    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        const result = await updateProfile(nickname.trim(), major.trim());
        if (!result.success) {
          setError(result.error || '프로필 수정에 실패했습니다.');
          return;
        }
        onComplete(result.profile);
      } else {
        await createProfile(nickname.trim(), major.trim());
        onComplete();
      }
    } catch {
      setError(isEdit ? '프로필 수정에 실패했습니다.' : '프로필 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-text-primary">
            {isEdit ? '프로필 수정' : (
              <>InsightStream<span className="text-accent-green">_</span></>
            )}
          </h2>
          <p className="text-sm text-text-muted">
            {isEdit
              ? '닉네임과 전공을 수정할 수 있어요.'
              : '닉네임과 전공을 설정하면 바로 시작할 수 있어요.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
            maxLength={20}
            required
            autoFocus
          />
          <input
            type="text"
            placeholder="전공 (예: 기계공학)"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
            maxLength={30}
            required
          />
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !nickname.trim() || !major.trim()}
            className="w-full py-3 rounded-lg bg-accent-green text-black text-sm font-bold hover:bg-accent-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEdit ? '수정 중...' : '설정 중...') : (isEdit ? '수정하기' : '시작하기')}
          </button>
          {isEdit && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              취소
            </button>
          )}
        </form>

        {!isEdit && (
          <p className="text-xs text-text-muted text-center">
            로그인 없이 이 기기에 프로필이 저장됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
