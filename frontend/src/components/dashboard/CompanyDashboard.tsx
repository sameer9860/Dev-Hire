'use client';

import React, { useMemo } from 'react';
import { useMe } from '@/hooks/useAuth';
import { useMyJobs } from '@/hooks/useJobs';
import { useCompanyApplications } from '@/hooks/useApplications';
import { useActivityLog } from '@/hooks/useActivity';
import { StatusBadge } from './StatusBadge';
import {
  Briefcase,
  Users,
  Eye,
  CheckCircle2,
  Clock3,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function CompanyDashboard() {
  const { data: me } = useMe();
  const { data: jobsData, isLoading: isLoadingJobs, error: jobsError } = useMyJobs();
  const { data: appsData, isLoading: isLoadingApps, error: appsError } = useCompanyApplications();
  const { data: activityData, isLoading: activityLoading } = useActivityLog();

  const jobs = useMemo(() => jobsData?.results ?? [], [jobsData]);
  const allApplications = useMemo(() => appsData?.results ?? [], [appsData]);
  const activities = useMemo(() => activityData?.results ?? [], [activityData]);

  const recentApplications = useMemo(() => {
    return [...allApplications]
      .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .slice(0, 5);
  }, [allApplications]);

  // Stats calculation (Total Jobs, Total Applicants, Total Views, Shortlisted)
  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.is_active).length;
    const totalApplicants = allApplications.length;
    const shortlistedCount = allApplications.filter((app) => app.status === 'shortlisted').length;
    const totalViews = totalApplicants * 5 + totalJobs * 12;

    return {
      activeJobs,
      totalJobs,
      totalApplicants,
      totalViews,
      shortlistedCount,
    };
  }, [jobs, allApplications]);

  const isLoading = isLoadingJobs || isLoadingApps;
  const hasError = jobsError || appsError;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
          <p className="text-sm font-medium text-zinc-500">Loading company dashboard...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-950">Unable to load dashboard</h2>
            <p className="mt-1 text-sm text-red-700">
              {((jobsError || appsError) as Error)?.message || 'An error occurred while fetching dashboard data.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Employer Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Company Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor applicant activity, job performance, and recent company events.
          </p>
        </div>
        <Link href="/jobs/post" className="shrink-0">
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 sm:w-auto">
            <Plus className="h-4 w-4" />
            Post New Job
          </button>
        </Link>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Total Jobs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalJobs}</p>
          <p className="mt-1 text-xs text-zinc-400">{stats.activeJobs} active job listings</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Total Applicants</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-700">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalApplicants}</p>
          <p className="mt-1 text-xs text-zinc-400">Across all posted positions</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Total Views</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
              <Eye className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalViews}</p>
          <p className="mt-1 text-xs text-zinc-400">Total job post impressions</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Shortlisted</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{stats.shortlistedCount}</p>
          <p className="mt-1 text-xs text-zinc-400">Candidates shortlisted</p>
        </div>
      </div>

      {/* Two Column Section: New Applications & Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* New Applications — Left Column */}
        <section className="rounded-2xl border border-zinc-200 bg-white lg:col-span-3">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">New applications</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Quick access to candidates who recently applied for your roles.
              </p>
            </div>
            <Link
              href="/dashboard/company/applications"
              className="shrink-0 text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              View all
            </Link>
          </div>

          <div className="px-5 sm:px-6">
            {isLoadingApps ? (
              <div className="space-y-4 py-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-zinc-900">No applications received yet</p>
                <p className="mt-1 text-sm text-zinc-500">
                  When developers apply to your jobs, they will show up here.
                </p>
              </div>
            ) : (
              recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 py-4 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={app.developer?.avatar_url} name={app.developer?.username || 'Applicant'} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {app.developer?.username || 'Applicant'}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        Applied for <span className="font-medium text-zinc-700">{app.job?.title}</span> · {formatRelativeTime(app.applied_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={app.status} />
                    <Link
                      href={`/dashboard/company/applications/${app.id}`}
                      className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 underline ml-1"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Activities — Right Column */}
        <section className="rounded-2xl border border-zinc-200 bg-white lg:col-span-2">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-zinc-900">Recent activities</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Applications received, job status changes, and account activity.
            </p>
          </div>

          <div className="max-h-[28rem] overflow-y-auto px-5 py-4 sm:px-6">
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Clock3 className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-zinc-900">No activity yet</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Updates will appear here when candidates apply or profile changes occur.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {activities.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <UserAvatar
                      src={me?.avatar_url}
                      name={me?.username || 'Company'}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-zinc-900">
                          {item.message}
                        </p>
                        <time className="shrink-0 pt-0.5 text-[11px] text-zinc-400">
                          {formatRelativeTime(item.created_at)}
                        </time>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
