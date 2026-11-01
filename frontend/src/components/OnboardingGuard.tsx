'use client';

/**
 * OnboardingGuard
 * ────────────────
 * Wraps every authenticated page. If the signed-in user is a developer
 * whose profile is still incomplete (< 8 mandatory fields filled), this
 * component:
 *   • Redirects any non-/profile route to /profile
 *   • Renders children WITHOUT AppShell (no sidebar / top-nav) — instead,
 *     shows a minimal branded header so the developer can only interact with
 *     the profile form in a clean, distraction-free layout.
 *
 * Once the profile is saved with all 8 fields, the redirect logic in
 * profile/page.tsx sends the user to their dashboard and this guard
 * no longer intercepts.
 *
 * Company, admin, and staff users are never affected.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { isDeveloperProfileComplete } from '@/lib/profileCompletion';

interface OnboardingGuardProps {
  /** Render-prop: wraps page content with AppShell in the normal (non-onboarding) flow. */
  appShell: (content: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}

export function OnboardingGuard({ appShell, children }: OnboardingGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMe();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const redirectedRef = useRef(false);

  const isDeveloper =
    !userLoading &&
    !profileLoading &&
    user != null &&
    user.role === 'developer';

  const profileComplete = !isDeveloper || isDeveloperProfileComplete(profile);

  useEffect(() => {
    if (userLoading || profileLoading) return;
    if (!user) return;
    if (!isDeveloper) return;
    if (profileComplete) return;
    // Profile is incomplete → force onto /profile
    if (pathname !== '/profile' && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace('/profile');
    }
  }, [userLoading, profileLoading, user, isDeveloper, profileComplete, pathname, router]);

  // Reset the redirect guard whenever the profile becomes complete
  useEffect(() => {
    if (profileComplete) {
      redirectedRef.current = false;
    }
  }, [profileComplete]);

  // While loading, avoid flash: render nothing (page skeleton will handle its own loading state)
  if (userLoading || profileLoading) {
    return <>{appShell(children)}</>;
  }

  // ── ONBOARDING MODE ──────────────────────────────────────────────────────
  // Developer with incomplete profile: render a minimal header + children
  // directly, completely bypassing AppShell (no sidebar, no mobile drawer).
  if (isDeveloper && !profileComplete) {
    return (
      <div className="min-h-screen bg-zinc-50">
        {/* Minimal branded top-bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950">
              <span className="text-sm font-bold text-white">DH</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-900">
              Dev<span className="font-bold">Hire</span>
            </span>
          </div>
          <div className="ml-2 flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Complete your profile to unlock the full app
          </div>
        </div>
        {/* Page content (profile form) rendered without any shell */}
        <main className="min-w-0">{children}</main>
      </div>
    );
  }

  // ── NORMAL MODE ──────────────────────────────────────────────────────────
  // Wrap children with AppShell as usual
  return <>{appShell(children)}</>;
}
