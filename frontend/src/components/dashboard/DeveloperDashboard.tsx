'use client';

import { useMyApplications } from '@/hooks/useApplications';
import { DashboardStats } from './DashboardStats';
import { ApplicationCard } from './ApplicationCard';
import { Card } from '@/components/ui/card';

export function DeveloperDashboard() {
  const { data, isLoading, error } = useMyApplications();
  const applications = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-red-50 border-red-200">
        <h2 className="text-lg font-bold text-red-900 mb-2">
          Error Loading Applications
        </h2>
        <p className="text-red-700">
          {error instanceof Error
            ? error.message
            : 'An error occurred while loading your applications.'}
        </p>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card className="p-12 text-center bg-blue-50 border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No Applications Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Start exploring job opportunities and apply to positions that match
          your skills.
        </p>
        <a
          href="/jobs"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Browse Jobs
        </a>
      </Card>
    );
  }

  // Sort applications by date (newest first)
  const sortedApplications = [...applications].sort((a, b) => {
    return (
      new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Applications
        </h1>
        <p className="text-gray-600">
          Track the status of all your job applications in one place.
        </p>
      </div>

      <DashboardStats applications={applications} />

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recent Applications
        </h2>
        <div className="space-y-4">
          {sortedApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
