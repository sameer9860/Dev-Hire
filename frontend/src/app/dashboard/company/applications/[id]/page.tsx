'use client';

import { use } from 'react';
import { CompanyApplicationDetailClient } from '@/components/dashboard/CompanyApplicationDetailClient';

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = parseInt(resolvedParams.id, 10);

  return <CompanyApplicationDetailClient id={applicationId} />;
}
