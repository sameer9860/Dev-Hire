'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Toaster, toast } from 'sonner';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5 }, // 5 minutes
    },
  }));

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const handleOnline = () => {
      toast.dismiss('network-status');
      toast.success("You are back online!");
    };
    const handleOffline = () => {
      toast.error("Internet connection lost. Working offline.", {
        duration: Infinity,
        id: "network-status",
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
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {!isAuthRoute && <Navbar />}
          {children}
          <Toaster richColors closeButton position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}