'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { hasStoredAuthToken } from '@/lib/authDestination';

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.error('Root layout error:', error);
  }, [error]);

  useEffect(() => {
    setIsAuthenticated(hasStoredAuthToken());
  }, []);

  return (
    <html lang="en">
      <body className="m-0 bg-zinc-50 font-sans antialiased">
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-100 bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <p className="text-[4rem] font-extrabold leading-none tracking-tighter text-zinc-100">500</p>
            <h1 className="-mt-4 text-xl font-semibold text-zinc-900">Critical error</h1>
            <p className="mt-2 text-sm text-zinc-500">
              The application encountered a critical failure. You can try again or choose where to go.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => reset()}
                className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Try Again
              </button>
              <a
                href={isAuthenticated ? '/jobs' : '/'}
                className="block w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
              </a>
              {!isAuthenticated && (
                <a
                  href="/login"
                  className="block w-full rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
