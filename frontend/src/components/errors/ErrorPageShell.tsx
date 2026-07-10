'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code, type LucideIcon } from 'lucide-react';
import { useMe } from '@/hooks/useAuth';
import { getAuthDestination } from '@/lib/authDestination';

interface ErrorPageShellProps {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  iconWrapperClassName: string;
  children?: React.ReactNode;
}

export function ErrorPageShell({
  code,
  title,
  description,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  children,
}: ErrorPageShellProps) {
  const { data: user, isLoading } = useMe();
  const destination = getAuthDestination(user);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 p-6">
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
          <p className="select-none text-[5.5rem] font-extrabold leading-none tracking-tighter text-zinc-100">
            {code}
          </p>

          <div
            className={`mx-auto -mt-6 mb-5 flex h-12 w-12 items-center justify-center rounded-full border ${iconWrapperClassName}`}
          >
            <Icon className={`h-6 w-6 ${iconClassName}`} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
            <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
          </div>

          <div className="mt-6 space-y-2.5">
            <Link href={destination.href} className="block w-full">
              <Button
                disabled={isLoading}
                className="w-full cursor-pointer bg-zinc-950 text-white hover:bg-zinc-800"
              >
                {isLoading ? 'Checking session...' : destination.label}
              </Button>
            </Link>

            {destination.isAuthenticated ? (
              <Link href="/jobs" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer border-zinc-200 hover:bg-zinc-50"
                >
                  Browse Jobs
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/jobs" className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer border-zinc-200 hover:bg-zinc-50"
                  >
                    Browse Jobs
                  </Button>
                </Link>
                <Link href="/login" className="block w-full">
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer text-zinc-600 hover:bg-zinc-50"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
