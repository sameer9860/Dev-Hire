'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AppShell from '@/components/AppShell';
import { OfflineOverlay } from '@/components/errors/OfflineOverlay';
import { Toaster, toast } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);
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
      setIsOffline(false);
      toast.dismiss('network-status');
      toast.success('You are back online!');
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = useCallback(() => {
    if (navigator.onLine) {
      setIsOffline(false);
      toast.success('You are back online!');
    } else {
      toast.error('Still offline. Check your connection.', {
        id: 'network-status',
      });
    }
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
      {isOffline && <OfflineOverlay onRetry={handleRetry} />}
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
