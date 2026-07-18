'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Code, User } from 'lucide-react';
import { useMe } from '@/hooks/useAuth';

export default function RegisterChoicePage() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  if (!mounted || isLoading || user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin border-4 border-zinc-950 border-t-transparent rounded-full w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 w-full max-w-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
        <div className="text-center mb-7">
          <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Code className="w-5 h-5 text-zinc-900" />
          </div>
          <h2 className="text-[20px] font-medium text-zinc-900 tracking-tight">Join DevHire</h2>
          <p className="text-[13px] text-zinc-500 mt-1">Choose how you want to register</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/register/developer"
            className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">I&apos;m a developer</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500">
                Sign up with email or continue with Google / GitHub.
              </p>
            </div>
          </Link>

          <Link
            href="/register/company"
            className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-zinc-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">I&apos;m a company</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500">
                Register with a valid company work email.
              </p>
            </div>
          </Link>
        </div>

        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-zinc-950 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
