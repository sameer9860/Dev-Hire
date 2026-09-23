'use client';

import React from 'react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Main Content Area */}
        <div className="flex items-start gap-4 p-6 bg-white">
          {/* Circular Red Warning Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100/80 text-red-500">
            <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
          </div>

          {/* Text Info */}
          <div className="flex-1 pt-0.5">
            <h3 className="text-lg font-bold text-zinc-900 leading-tight">
              Logout
            </h3>
            <p className="mt-1.5 text-sm font-normal text-zinc-500 leading-relaxed">
              Are you sure you want to logout from Devhire ?
            </p>
          </div>
        </div>

        {/* Footer Buttons Strip */}
        <div className="flex items-center justify-end gap-3 bg-zinc-50/80 px-6 py-4 border-t border-zinc-100">
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
            className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none shadow-2xs"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
