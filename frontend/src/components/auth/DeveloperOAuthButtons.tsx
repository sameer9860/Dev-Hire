'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchOAuthConfig,
  startGitHubOAuth,
  startGoogleOAuth,
  type OAuthProvider,
} from '@/lib/oauth';

type Props = {
  labelPrefix?: string;
  /** Wording for unavailable OAuth toast — login vs register */
  action?: 'sign-in' | 'sign-up';
};

export default function DeveloperOAuthButtons({
  labelPrefix = 'Continue',
  action = 'sign-in',
}: Props) {
  const [googleId, setGoogleId] = useState('');
  const [githubId, setGithubId] = useState('');
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    fetchOAuthConfig()
      .then((cfg) => {
        setGoogleId(cfg.google_client_id || '');
        setGithubId(cfg.github_client_id || '');
      })
      .catch(() => {
        // OAuth optional until env is configured
      });
  }, []);

  const handle = (provider: OAuthProvider) => {
    const id = provider === 'google' ? googleId : githubId;
    if (!id) {
      toast.message(
        `${provider === 'google' ? 'Google' : 'GitHub'} ${action} isn’t available yet. Please wait...`
      );
      return;
    }
    setLoading(provider);
    if (provider === 'google') startGoogleOAuth(id);
    else startGitHubOAuth(id);
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={() => handle('google')}
        disabled={loading !== null}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white py-2.5 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.58 1.68l3.4-3.4A11.95 11.95 0 0 0 12 1C8.08 1 4.67 3 2.69 6.07l2.58 3.69Z"
          />
          <path
            fill="#34A853"
            d="M16.04 18.01A7.08 7.08 0 0 1 12 19.1c-2.97 0-5.5-1.82-6.62-4.43l-2.69 3.85A11.96 11.96 0 0 0 12 23c2.93 0 5.73-1.06 7.83-3l-3.79-1.99Z"
          />
          <path
            fill="#4A90D9"
            d="M19.83 20c2.26-2.1 3.67-5.18 3.17-9H12v4.18h6.28a5.43 5.43 0 0 1-2.24 3.82l3.79 1.99Z"
          />
          <path
            fill="#FBBC05"
            d="M5.38 14.67A7.12 7.12 0 0 1 4.9 12c0-.93.17-1.83.47-2.67l-2.68-3.7A11.9 11.9 0 0 0 1 12c0 1.97.48 3.83 1.32 5.47l3.06-2.8Z"
          />
        </svg>
        {loading === 'google' ? '…' : `${labelPrefix} Google`}
      </button>
      <button
        type="button"
        onClick={() => handle('github')}
        disabled={loading !== null}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white py-2.5 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60"
      >
        <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
        {loading === 'github' ? '…' : `${labelPrefix} GitHub`}
      </button>
    </div>
  );
}
