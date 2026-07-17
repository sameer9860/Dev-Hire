'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';
import { deleteCookie } from '@/lib/cookies';
import { useQueryClient } from '@tanstack/react-query';
import {
  Menu,
  X,
  LogOut,
  Briefcase,
  User,
  ChevronDown,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const { data: user, isLoading } = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    queryClient.clear();
    router.push('/login');
  };

  const isLoggedIn = mounted && !!user;

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
        scrolled
          ? 'border-zinc-200 bg-white/80 backdrop-blur-md shadow-[0_2px_15px_rgba(0,0,0,0.02)]'
          : 'border-zinc-100 bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 shadow-md">
                <span className="text-sm font-bold text-white">DH</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-zinc-900">
                Dev<span className="font-bold text-zinc-950">Hire</span>
              </span>
            </Link>

            {/* Guest only: Find Jobs — hidden when logged in */}
            {mounted && !user && (
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  href="/jobs"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    pathname === '/jobs'
                      ? 'bg-zinc-50 font-semibold text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:bg-zinc-50/50 hover:text-zinc-900'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  Find Jobs
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!mounted || isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-100" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200/80 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-2xs transition-colors duration-200 hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.username}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right animate-in fade-in slide-in-from-top-1 rounded-xl border border-zinc-200/85 bg-white p-1.5 shadow-lg ring-1 ring-black/5 duration-100 focus:outline-none">
                    <div className="mb-1 border-b border-zinc-100 px-3 py-2">
                      <p className="text-xs font-medium text-zinc-400">Signed in as</p>
                      <p className="truncate text-sm font-semibold text-zinc-900">{user.username}</p>
                      <span className="mt-1 inline-flex items-center rounded-md border border-zinc-200/40 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-zinc-700">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href={user.role === 'company' ? '/dashboard/company' : '/dashboard/developer'}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                      Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <User className="h-4 w-4 text-zinc-500" />
                      My Profile
                    </Link>

                    <Link
                      href={`/profile/${user.username}`}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <ExternalLink className="h-4 w-4 text-zinc-500" />
                      Public Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg border-t border-zinc-100 px-3 py-2 pt-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50/50"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="hidden items-center gap-3 md:flex">
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-950"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-zinc-800"
                  >
                    Get Started
                  </Link>
                </div>

                <div className="flex md:hidden">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none"
                  >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Guest mobile menu only */}
      {isOpen && !isLoggedIn && (
        <div className="animate-in slide-in-from-top border-t border-zinc-150 bg-white/95 backdrop-blur-md duration-150 md:hidden">
          <div className="space-y-1.5 px-3 py-4">
            <Link
              href="/jobs"
              className="block rounded-lg px-4 py-2.5 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            >
              Find Jobs
            </Link>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 px-4 pt-4">
              <Link
                href="/login"
                className="flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
