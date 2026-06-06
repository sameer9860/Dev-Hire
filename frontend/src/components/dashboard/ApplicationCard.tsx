'use client';

import type { Application } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import Link from 'next/link';

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const appliedDate = new Date(application.applied_at);
  const formattedDate = appliedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {application.job.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {application.job.company.company_name}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>{application.job.location}</span>
            <span className="capitalize">
              {application.job.job_type.replace('-', ' ')}
            </span>
            {application.job.is_remote && (
              <span className="text-green-600 font-medium">Remote</span>
            )}
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="mb-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-4">
          Applied on {formattedDate}
        </div>
        {application.notes && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
            <p className="text-sm text-gray-600">{application.notes}</p>
          </div>
        )}
      </div>

      <Link href={`/jobs/${application.job.id}`}>
        <Button variant="outline" className="w-full">
          View Job Details
        </Button>
      </Link>
    </Card>
  );
}
