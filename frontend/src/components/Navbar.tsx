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
  PlusCircle, 
  LayoutDashboard,
  FileText,
  ExternalLink
} from 'lucide-react';

export default function Navbar() {
  const { data: user, isLoading } = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for shadow effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on page navigation
  useEffect(() => {
    setIsOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    // 1. Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // 2. Clear tokens from cookies
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    
    // 3. Reset React Query Cache
    queryClient.clear();
    
    // 4. Redirect to login page
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  // Render navigation links based on role
  const renderNavLinks = (isMobile: boolean = false) => {
    const baseStyle = isMobile
      ? "block px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200"
      : "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5";

    const getLinkStyle = (path: string) => {
      const active = isActive(path);
      if (isMobile) {
        return active
          ? `${baseStyle} bg-zinc-950 text-white`
          : `${baseStyle} text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900`;
      }
      return active
        ? `${baseStyle} text-zinc-950 bg-zinc-50 font-semibold shadow-xs`
        : `${baseStyle} text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/50`;
    };

    return (
      <>
        {(!user || user.role !== 'company') && (
          <Link href="/jobs" className={getLinkStyle('/jobs')}>
            <Briefcase className="w-4 h-4" />
            Find Jobs
          </Link>
        )}
        
        {user && user.role === 'developer' && (
          <>
            <Link href="/dashboard/developer" className={getLinkStyle('/dashboard/developer')}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/dashboard/developer" className={getLinkStyle('/dashboard/developer')}>
              <FileText className="w-4 h-4" />
              My Applications
            </Link>
          </>
        )}

        {user && user.role === 'company' && (
          <>
            <Link href="/dashboard/company" className={getLinkStyle('/dashboard/company')}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/jobs/post" className={getLinkStyle('/jobs/post')}>
              <PlusCircle className="w-4 h-4" />
              Post Job
            </Link>
          </>
        )}
      </>
    );
  };

  return (
    <nav className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
      scrolled 
        ? 'border-zinc-200 bg-white/80 backdrop-blur-md shadow-[0_2px_15px_rgba(0,0,0,0.02)]' 
        : 'border-zinc-100 bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/jobs" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">DH</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-zinc-900">
                Dev<span className="font-bold text-zinc-950">Hire</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {renderNavLinks(false)}
            </div>
          </div>

          {/* Desktop Right Panel (Auth control) */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-100 rounded-lg animate-pulse"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200/80 bg-white hover:bg-zinc-50 transition-colors duration-200 text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-zinc-200/85 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                      <p className="text-xs text-zinc-400 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">{user.username}</p>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 capitalize border border-zinc-200/40">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer font-medium text-left"
                    >
                      <User className="w-4 h-4 text-zinc-500" />
                      My Profile
                    </Link>

                    <Link
                      href={`/profile/${user.username}`}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer font-medium text-left"
                    >
                      <ExternalLink className="w-4 h-4 text-zinc-500" />
                      Public Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50/50 rounded-lg transition-colors cursor-pointer font-medium text-left border-t border-zinc-100 mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-zinc-950 hover:bg-zinc-800 transition-all duration-150 shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-zinc-150 bg-white/95 backdrop-blur-md animate-in slide-in-from-top duration-150">
          <div className="space-y-1.5 px-3 py-4">
            {renderNavLinks(true)}
            
            <div className="border-t border-zinc-100 pt-4 mt-4">
              {isLoading ? (
                <div className="h-10 bg-zinc-100 rounded-lg animate-pulse w-full"></div>
              ) : user ? (
                <div className="px-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-xs text-white font-bold">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{user.username}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-100 text-zinc-600 capitalize border border-zinc-200/50">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Link
                      href="/profile"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-150 rounded-xl transition-all font-semibold text-xs cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      Edit Profile
                    </Link>
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-150 rounded-xl transition-all font-semibold text-xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Public Profile
                    </Link>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all font-semibold text-sm cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-4">
                  <Link
                    href="/login"
                    className="flex items-center justify-center py-2.5 px-4 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center py-2.5 px-4 rounded-xl bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
