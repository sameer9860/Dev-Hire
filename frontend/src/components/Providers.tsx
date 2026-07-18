'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AppShell from '@/components/AppShell';
import { Toaster, toast } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5 },
    },
  }));

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname.startsWith('/auth/callback');
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleOnline = () => {
      toast.dismiss('network-status');
      toast.success('You are back online!');
    };
    const handleOffline = () => {
      toast.error('Internet connection lost. Working offline.', {
        duration: Infinity,
        id: 'network-status',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthRoute ? (
        children
      ) : isHomePage ? (
        <>
          <Navbar />
          {children}
        </>
      ) : (
        <AppShell>{children}</AppShell>
      )}
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
