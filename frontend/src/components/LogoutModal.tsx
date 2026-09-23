'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { deleteCookie } from '@/lib/cookies';
import { toast } from 'sonner';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleConfirmLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    queryClient.clear();
    toast.success('Logged out successfully.');
    onClose();
    router.push('/login');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      {/* Full-viewport backdrop — portaled to body so blur isn't clipped by header/sidebar */}
      <button
        type="button"
        aria-label="Close logout dialog"
        className="absolute inset-0 bg-zinc-950/55 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-150">
        <div className="flex items-start gap-4 bg-white p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100/80 text-red-500">
            <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
          </div>

          <div className="flex-1 pt-0.5">
            <h3 id="logout-modal-title" className="text-lg font-bold leading-tight text-zinc-900">
              Logout
            </h3>
            <p className="mt-1.5 text-sm font-normal leading-relaxed text-zinc-500">
              Are you sure you want to logout from DevHire?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-red-700 focus:outline-none"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
