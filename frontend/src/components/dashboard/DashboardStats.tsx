'use client';

import type { Application } from '@/types/api';
import { Card } from '@/components/ui/card';

interface DashboardStatsProps {
  applications: Application[];
}

export function DashboardStats({ applications }: DashboardStatsProps) {
  const totalApplied = applications.length;
  const pending = applications.filter((a) => a.status === 'pending').length;
  const shortlisted = applications.filter(
    (a) => a.status === 'shortlisted'
  ).length;
  const accepted = applications.filter((a) => a.status === 'accepted').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;

  const stats = [
    {
      label: 'Total Applied',
      value: totalApplied,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Pending',
      value: pending,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
    {
      label: 'Shortlisted',
      value: shortlisted,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      label: 'Accepted',
      value: accepted,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Rejected',
      value: rejected,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className={`${stat.bgColor} p-6 border-0`}>
          <div className="text-sm font-medium text-gray-600 mb-2">
            {stat.label}
          </div>
          <div className={`text-3xl font-bold ${stat.textColor}`}>
            {stat.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
