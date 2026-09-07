'use client';

import { Suspense } from 'react';
import { CompanyApplicationsClient } from '@/components/dashboard/CompanyApplicationsClient';
import { Loader2 } from 'lucide-react';

export default function CompanyApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        </div>
      }
    >
      <CompanyApplicationsClient />
    </Suspense>
  );
}
