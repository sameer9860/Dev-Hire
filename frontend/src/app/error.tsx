'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { ErrorPageShell } from '@/components/errors/ErrorPageShell';

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
    <ErrorPageShell
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred. You can try again, or we'll take you back to a safe place shortly."
      icon={AlertTriangle}
      iconClassName="text-red-600"
      iconWrapperClassName="border-red-100 bg-red-50 text-red-600"
    >
      <Button
        onClick={() => reset()}
        variant="outline"
        className="w-full cursor-pointer border-zinc-200 hover:bg-zinc-50"
      >
        <RotateCcw className="mr-1.5 h-4 w-4" />
        Try Again
      </Button>

      {error.message && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left">
          <code className="break-all font-mono text-xs text-red-600">{error.message}</code>
        </div>
      )}
    </ErrorPageShell>
  );
}
