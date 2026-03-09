'use client';

import { useToast } from '@/lib/toast-context';

export default function Toast() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-toast-in ${
            toast.type === 'success'
              ? 'bg-accent-green text-black'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-bg-card text-text-primary border border-border'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
