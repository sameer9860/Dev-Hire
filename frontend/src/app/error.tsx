'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-100">
          <AlertTriangle className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Something went wrong</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            An unexpected error occurred in the application. Our engineering team has been notified.
          </p>
          {error.message && (
            <div className="text-left bg-zinc-50 border border-zinc-200 rounded-lg p-3 mt-4 overflow-x-auto max-h-24">
              <code className="text-xs text-red-600 font-mono break-all">{error.message}</code>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={() => reset()} className="bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 cursor-pointer">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/jobs'} className="flex items-center gap-1.5 border-zinc-200 hover:bg-zinc-50 cursor-pointer">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
