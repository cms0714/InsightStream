'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '@/lib/types';
import { fetchNotifications, markNotificationsRead } from '@/lib/actions';

interface NotificationBellProps {
  onPostClick: (postId: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function NotificationBell({ onPostClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleNotificationClick = (postId: string) => {
    setIsOpen(false);
    onPostClick(postId);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-text-muted hover:text-accent-green transition-colors"
        aria-label="알림"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-green text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-bg-card border border-border rounded-xl shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">알림</p>
          </div>
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <p className="text-sm">아직 알림이 없어요</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.postId)}
                  className={`w-full text-left px-4 py-3 hover:bg-bg-primary/50 transition-colors border-b border-border last:border-b-0 ${
                    !n.read ? 'bg-accent-green/5' : ''
                  }`}
                >
                  <p className="text-xs text-text-primary">
                    <span className="font-semibold text-accent-green">{n.actorName}</span>
                    {n.type === 'reaction' ? '님이 반응했어요' : '님이 댓글을 남겼어요'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">{n.postTitle}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{timeAgo(n.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
