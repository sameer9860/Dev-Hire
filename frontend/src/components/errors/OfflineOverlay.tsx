'use client';

import { Button } from '@/components/ui/button';
import { Code, RotateCcw, WifiOff } from 'lucide-react';
import { WireCutoffIllustration } from '@/components/errors/WireCutoffIllustration';

interface OfflineOverlayProps {
  onRetry: () => void;
}

export function OfflineOverlay({ onRetry }: OfflineOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-50 p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm">
            <Code className="h-5 w-5 text-zinc-900" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">DevHire</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <WireCutoffIllustration className="mx-auto mb-2 h-36 w-full" />

          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
            <WifiOff className="h-6 w-6 text-orange-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              Connection cut off
            </h1>
            <p className="text-sm leading-relaxed text-zinc-500">
              Looks like your internet cable got snipped. Check your connection and try again.
            </p>
          </div>

          <div className="mt-6">
            <Button
              onClick={onRetry}
              className="w-full cursor-pointer bg-zinc-950 text-white hover:bg-zinc-800"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
