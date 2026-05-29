'use client';

import { useMe } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useMe();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if no access token
    if (!isLoading && !user) {
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
      if (!hasToken) {
        router.push('/login');
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/jobs" className="text-2xl font-bold text-blue-600">
              DevHire
            </Link>
            <div className="flex items-center gap-6">
              {user.role === 'developer' && (
                <>
                  <Link
                    href="/dashboard/developer"
                    className="px-4 py-2 font-medium text-gray-700 hover:text-gray-900"
                  >
                    My Applications
                  </Link>
                </>
              )}
              {user.role === 'company' && (
                <>
                  <Link
                    href="/dashboard/company"
                    className="px-4 py-2 font-medium text-gray-700 hover:text-gray-900"
                  >
                    Applicants
                  </Link>
                  <Link
                    href="/jobs/post"
                    className="px-4 py-2 font-medium text-gray-700 hover:text-gray-900"
                  >
                    Post Job
                  </Link>
                </>
              )}
              <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                <span className="text-sm text-gray-700">
                  {user.username}
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    router.push('/login');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
