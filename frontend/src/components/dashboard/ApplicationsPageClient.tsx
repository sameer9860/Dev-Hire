'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMyApplications } from '@/hooks/useApplications';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import type { ApplicationStatus } from '@/types/api';
import { ExternalLink } from 'lucide-react';

const FILTERS: { key: 'all' | ApplicationStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ApplicationsPageClient() {
  const { data, isLoading, error } = useMyApplications();
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const applications = data?.results ?? [];

  const filtered = useMemo(() => {
    const list =
      filter === 'all'
        ? applications
        : applications.filter((app) => app.status === filter);
    return [...list].sort(
      (a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
    );
  }, [applications, filter]);

  const counts = useMemo(() => {
    const base: Record<'all' | ApplicationStatus, number> = {
      all: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const app of applications) {
      base[app.status] += 1;
    }
    return base;
  }, [applications]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm font-medium text-zinc-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Error loading applications</h2>
        <p className="mt-1 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Applications</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Track every application across pending, reviewing, shortlisted, accepted, and rejected.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={[
                'cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
              ].join(' ')}
            >
              {item.label}
              <span className={active ? 'ml-1.5 text-zinc-300' : 'ml-1.5 text-zinc-400'}>
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-900">No applications in this view</p>
          <p className="mt-1 text-sm text-zinc-500">
            Apply to jobs to see them listed here.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Find Jobs
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-500">S.N</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Job Title</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Location</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Applied Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, index) => (
                  <tr
                    key={app.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70"
                  >
                    <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{app.job.title}</div>
                      <div className="text-xs text-zinc-400">
                        {app.job.company.company_name || app.job.company.username}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {app.job.is_remote ? 'Remote' : app.job.location}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(app.applied_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/jobs/${app.job.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-950"
                        aria-label={`See details for ${app.job.title}`}
                      >
                        See detail
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
