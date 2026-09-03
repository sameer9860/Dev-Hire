'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && !user.is_staff && !user.is_superuser) {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (user.role !== 'admin' && !user.is_staff && !user.is_superuser) {
    return null;
  }

  return <AdminDashboard />;
}
