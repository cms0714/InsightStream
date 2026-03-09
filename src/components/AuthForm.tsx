'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/actions';

interface AuthFormProps {
  onComplete: () => void;
}

export default function AuthForm({ onComplete }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [major, setMajor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        if (!nickname.trim() || !major.trim()) {
          setError('닉네임과 전공을 입력해주세요.');
          return;
        }
        const result = await signUp(email, password, nickname.trim(), major.trim());
        if (!result.success) {
          setError(result.error || '회원가입에 실패했습니다.');
          return;
        }
      } else {
        const result = await signIn(email, password);
        if (!result.success) {
          setError(result.error || '로그인에 실패했습니다.');
          return;
        }
      }
      onComplete();
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-text-primary">
            InsightStream<span className="text-accent-green">_</span>
          </h2>
          <p className="text-sm text-text-muted">
            {mode === 'login' ? '로그인하고 인사이트를 공유하세요' : '계정을 만들어 시작하세요'}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-lg bg-bg-primary border border-border p-0.5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-accent-green text-black' : 'text-text-muted'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-accent-green text-black' : 'text-text-muted'
            }`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
            minLength={6}
            required
          />
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
                maxLength={20}
                required
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
            </>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent-green text-black text-sm font-bold hover:bg-accent-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (mode === 'login' ? '로그인 중...' : '가입 중...')
              : (mode === 'login' ? '로그인' : '회원가입')
            }
          </button>
        </form>
      </div>
    </div>
  );
}
