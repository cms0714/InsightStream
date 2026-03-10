'use client';

import { useState, useRef } from 'react';
import { Category } from '@/lib/types';
import { categories } from '@/lib/categories';
import { useToast } from '@/lib/toast-context';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

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
    images?: string[];
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      showToast('이미지는 5MB 이하만 가능합니다.', 'info');
    }
    const total = imageFiles.length + validFiles.length;
    if (total > 4) {
      showToast('이미지는 최대 4장까지 가능합니다.', 'info');
      return;
    }
    setImageFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    const supabase = createSupabaseBrowser();
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('post-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

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
    if (!content.trim() || selectedCategories.length === 0 || submitting) return;
    if (!url.trim() && imageFiles.length === 0) {
      showToast('URL 또는 이미지를 1개 이상 첨부해주세요.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      setImageUploading(true);
      const imageUrls = await uploadImages();
      setImageUploading(false);

      await onSubmit({
        url: url || '',
        title: ogData?.title || url || '이미지 포스트',
        thumbnail: ogData?.thumbnail || '',
        content,
        categories: selectedCategories,
        images: imageUrls,
      });
      setUrl('');
      setContent('');
      setSelectedCategories([]);
      setOgData(null);
      imagePreviews.forEach((p) => URL.revokeObjectURL(p));
      setImageFiles([]);
      setImagePreviews([]);
      setIsOpen(false);
    } catch {
      showToast('글 작성에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
      setImageUploading(false);
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
          placeholder="URL을 붙여넣으세요 (선택)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => fetchOgData(url)}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
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
      {/* Image upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={imageFiles.length >= 4}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text-muted hover:border-accent-green/50 hover:text-accent-green transition-colors disabled:opacity-30"
        >
          📷 이미지 추가 ({imageFiles.length}/4)
        </button>
        {imagePreviews.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative shrink-0">
                <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
          {imageUploading ? '이미지 업로드 중...' : submitting ? '공유 중...' : '공유하기'}
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
