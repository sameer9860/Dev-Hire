'use client';

import api from '@/lib/api';

export type OAuthProvider = 'google' | 'github';

const FRONTEND_ORIGIN =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function oauthRedirectUri(provider: OAuthProvider) {
  return `${FRONTEND_ORIGIN}/auth/callback/${provider}`;
}

export async function fetchOAuthConfig() {
  const { data } = await api.get<{ google_client_id: string; github_client_id: string }>(
    '/auth/oauth/config/'
  );
  return data;
}

export function startGoogleOAuth(clientId: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthRedirectUri('google'),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function startGitHubOAuth(clientId: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthRedirectUri('github'),
    scope: 'read:user user:email',
  });
  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeOAuthCode(provider: OAuthProvider, code: string) {
  const { data } = await api.post(`/auth/oauth/${provider}/`, {
    code,
    redirect_uri: oauthRedirectUri(provider),
  });
  return data as {
    access: string;
    refresh: string;
    user: { id: number; username: string; email: string; role: string };
  };
}
