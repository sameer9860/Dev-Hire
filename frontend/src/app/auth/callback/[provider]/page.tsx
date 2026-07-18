'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { setCookie } from '@/lib/cookies';
import { exchangeOAuthCode, type OAuthProvider } from '@/lib/oauth';

function CallbackInner() {
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const provider = params.provider as OAuthProvider;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setMessage('Sign-in was cancelled.');
      toast.error('OAuth sign-in was cancelled.');
      router.replace('/login');
      return;
    }

    if (!code || (provider !== 'google' && provider !== 'github')) {
      setMessage('Invalid OAuth callback.');
      toast.error('Invalid OAuth callback.');
      router.replace('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await exchangeOAuthCode(provider, code);
        if (cancelled) return;
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        const MAX_AGE = 30 * 24 * 60 * 60;
        setCookie('access_token', data.access, MAX_AGE);
        setCookie('refresh_token', data.refresh, MAX_AGE);
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        toast.success(`Welcome, ${data.user.username}!`);
        router.replace('/jobs');
      } catch (err: unknown) {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'OAuth sign-in failed.';
        toast.error(typeof detail === 'string' ? detail : 'OAuth sign-in failed.');
        router.replace('/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.provider, searchParams, router, queryClient]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
      <p className="text-sm font-medium text-zinc-700">{message}</p>
      <p className="mt-1 text-xs text-zinc-400">Developer sign-in via {params.provider}</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
            <p className="text-sm font-medium text-zinc-700">Signing you in…</p>
          </div>
        }
      >
        <CallbackInner />
      </Suspense>
    </div>
  );
}
