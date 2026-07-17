'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';
import { deleteCookie } from '@/lib/cookies';
import { useQueryClient } from '@tanstack/react-query';
import {
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Briefcase,
  User,
  PlusCircle,
  LayoutDashboard,
  ExternalLink,
  Settings,
  ChevronDown,
} from 'lucide-react';

type ShellContextValue = {
  open: boolean;
  collapsed: boolean;
  toggleOpen: () => void;
  toggleCollapsed: () => void;
  closeMobile: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within AppShell');
  return ctx;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950">
        <span className="text-sm font-bold text-white">DH</span>
      </div>
      {!compact && (
        <span className="truncate text-base font-semibold tracking-tight text-zinc-900">
          Dev<span className="font-bold">Hire</span>
        </span>
      )}
    </Link>
  );
}

function UserDropdown() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-dropdown]')) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    queryClient.clear();
    router.push('/login');
  };

  if (!mounted || isLoading) {
    return <div className="h-9 w-28 animate-pulse rounded-lg bg-zinc-100" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm font-semibold text-zinc-600 hover:text-zinc-950"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" data-user-dropdown>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
          {user.username.substring(0, 2).toUpperCase()}
        </div>
        <span className="hidden max-w-[100px] truncate sm:inline">{user.username}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
          <div className="mb-1 border-b border-zinc-100 px-3 py-2">
            <p className="text-xs font-medium text-zinc-400">Signed in as</p>
            <p className="truncate text-sm font-semibold text-zinc-900">{user.username}</p>
            <span className="mt-1 inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-zinc-700">
              {user.role}
            </span>
          </div>
          <Link
            href={user.role === 'company' ? '/dashboard/company' : '/dashboard/developer'}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 text-zinc-500" />
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4 text-zinc-500" />
            My Profile
          </Link>
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-4 w-4 text-zinc-500" />
            Public Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-zinc-100 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const { data: user, isLoading } = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { closeMobile } = useShell();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    queryClient.clear();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/jobs') {
      return (
        pathname === '/jobs' ||
        (pathname.startsWith('/jobs/') && !pathname.startsWith('/jobs/post'))
      );
    }
    if (path === '/profile') return pathname === '/profile';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const linkClass = (path: string) =>
    [
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      collapsed ? 'justify-center px-2' : '',
      isActive(path)
        ? 'bg-zinc-100 text-zinc-950'
        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
    ].join(' ');

  const Item = ({
    href,
    path,
    icon: Icon,
    label,
  }: {
    href: string;
    path: string;
    icon: typeof Briefcase;
    label: string;
  }) => (
    <Link
      href={href}
      className={linkClass(path)}
      title={collapsed ? label : undefined}
      onClick={closeMobile}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 sm:px-3">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Navigate
          </p>
        )}

        {(!mounted || !user || user.role !== 'company') && (
          <Item href="/jobs" path="/jobs" icon={Briefcase} label="Find Jobs" />
        )}

        {mounted && user?.role === 'developer' && (
          <Item
            href="/dashboard/developer"
            path="/dashboard/developer"
            icon={LayoutDashboard}
            label="Dashboard"
          />
        )}

        {mounted && user?.role === 'company' && (
          <>
            <Item
              href="/dashboard/company"
              path="/dashboard/company"
              icon={LayoutDashboard}
              label="Dashboard"
            />
            <Item href="/jobs/post" path="/jobs/post" icon={PlusCircle} label="Post Job" />
          </>
        )}

        {mounted && user && (
          <Item href="/profile" path="/profile" icon={User} label="My Profile" />
        )}
      </nav>

      <div className="mt-auto border-t border-zinc-100 px-2 py-3 sm:px-3">
        {!mounted || isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-zinc-100" />
        ) : user ? (
          <div className="space-y-1">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Account
              </p>
            )}
            <Item href="/settings" path="/settings" icon={Settings} label="Settings" />
            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? 'Log out' : undefined}
              className={[
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600',
                collapsed ? 'justify-center px-2' : '',
              ].join(' ')}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && 'Log out'}
            </button>
            {!collapsed && (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{user.username}</p>
                  <p className="truncate text-[11px] capitalize text-zinc-500">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const value: ShellContextValue = {
    open,
    collapsed,
    toggleOpen: () => setOpen((v) => !v),
    toggleCollapsed: () => setCollapsed((v) => !v),
    closeMobile: () => setOpen(false),
  };

  return (
    <ShellContext.Provider value={value}>
      <div className="flex min-h-screen bg-white">
        {/* Desktop sidebar — full height, brand on top */}
        <aside
          className={[
            'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ease-out lg:flex',
            collapsed ? 'w-[4.5rem]' : 'w-60 xl:w-64',
          ].join(' ')}
        >
          <div
            className={[
              'flex h-14 shrink-0 items-center border-b border-zinc-200',
              collapsed ? 'justify-center px-2' : 'px-4',
            ].join(' ')}
          >
            <Brand compact={collapsed} />
          </div>
          <div className="min-h-0 flex-1">
            <SidebarNav collapsed={collapsed} />
          </div>
        </aside>

        {/* Mobile overlay */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        {/* Mobile drawer — brand on top */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-zinc-200 bg-white transition-transform duration-300 ease-out lg:hidden',
            open ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
            <Brand />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <SidebarNav collapsed={false} />
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-3 backdrop-blur-md sm:px-4 lg:px-6">
            <div className="flex items-center gap-2">
              {/* Mobile: open drawer */}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Desktop: collapse/expand */}
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 lg:inline-flex"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>

              {/* Mobile brand (when drawer closed) */}
              <div className="lg:hidden">
                <Brand />
              </div>
            </div>

            <UserDropdown />
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
