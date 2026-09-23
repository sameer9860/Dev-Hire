'use client';

import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-xs">
            <AlertTriangle className="h-6 w-6" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold tracking-tight text-zinc-900">
            Logout
          </h3>

          {/* Message */}
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            Are you sure you want to logout from Devhire ?
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 shadow-xs focus:outline-none"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
