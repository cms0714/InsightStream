'use client';

interface BookmarkButtonProps {
  postId: string;
  isBookmarked: boolean;
  onToggle: (postId: string) => void;
}

export default function BookmarkButton({ postId, isBookmarked, onToggle }: BookmarkButtonProps) {
  return (
    <button
      onClick={() => onToggle(postId)}
      className="p-1.5 rounded-md hover:bg-bg-primary transition-colors"
      aria-label={isBookmarked ? '북마크 해제' : '북마크'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isBookmarked ? '#00FF00' : 'none'}
        stroke={isBookmarked ? '#00FF00' : '#888888'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
