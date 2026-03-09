'use client';

import { useState } from 'react';
import { Category } from '@/lib/types';
import { categories } from '@/lib/categories';
import { useToast } from '@/lib/toast-context';

interface OgData {
  title: string;
  thumbnail: string;
}

interface PostFormProps {
  onSubmit: (data: {
    url: string;
    title: string;
    thumbnail: string;
    content: string;
    categories: Category[];
  }) => Promise<void>;
}

export default function PostForm({ onSubmit }: PostFormProps) {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [ogData, setOgData] = useState<OgData | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const fetchOgData = async (inputUrl: string) => {
    if (!inputUrl.trim()) return;
    setOgLoading(true);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(inputUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setOgData(data);
      }
    } catch {
      showToast('링크 정보를 가져오지 못했어요. URL을 확인해주세요.', 'info');
    } finally {
      setOgLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !content.trim() || selectedCategories.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        url,
        title: ogData?.title || url,
        thumbnail: ogData?.thumbnail || '',
        content,
        categories: selectedCategories,
      });
      setUrl('');
      setContent('');
      setSelectedCategories([]);
      setOgData(null);
      setIsOpen(false);
    } catch {
      showToast('글 작성에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="px-4 pt-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 rounded-xl border border-border bg-bg-card text-text-muted text-sm hover:border-accent-green/50 transition-colors"
        >
          + 인사이트 공유하기
        </button>
      </div>
    );
  }

  const categoryOptions = categories.filter((c) => c.key !== 'all' && c.key !== 'saved');

  return (
    <form onSubmit={handleSubmit} className="mx-4 mt-4 p-4 rounded-xl border border-border bg-bg-card space-y-3">
      <div>
        <input
          type="url"
          placeholder="URL을 붙여넣으세요"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => fetchOgData(url)}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
          required
        />
      </div>
      {ogLoading && (
        <p className="text-xs text-accent-green animate-pulse">메타데이터 불러오는 중...</p>
      )}
      {ogData && (
        <div className="flex gap-3 p-2 rounded-lg bg-bg-primary border border-border">
          {ogData.thumbnail && (
            <img src={ogData.thumbnail} alt="" className="w-20 h-14 object-cover rounded" />
          )}
          <p className="text-xs text-text-primary line-clamp-2 flex-1">{ogData.title}</p>
        </div>
      )}
      <textarea
        placeholder="이 콘텐츠에 대한 생각을 자유롭게 적어주세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green resize-none"
        required
      />
      <div>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => {
            const isSelected = selectedCategories.includes(c.key as Category);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleCategory(c.key as Category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-accent-green text-black'
                    : 'bg-bg-primary border border-border text-text-muted hover:border-accent-green/50'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-xs text-text-muted mt-1.5">카테고리를 1개 이상 선택해주세요</p>
        )}
      </div>
      <div className="flex gap-2 items-center justify-end">
        <button
          type="submit"
          disabled={submitting || selectedCategories.length === 0}
          className="px-6 py-2 rounded-lg bg-accent-green text-black text-sm font-semibold hover:bg-accent-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '공유 중...' : '공유하기'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-3 py-2 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}
