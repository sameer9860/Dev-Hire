'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5 }, // 5 minutes
    },
  }));

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {!isAuthRoute && <Navbar />}
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}