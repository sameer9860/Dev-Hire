'use client';

import Link from 'next/link';
import { useMe } from '@/hooks/useAuth';
import { useMyApplications } from '@/hooks/useApplications';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useActivityLog } from '@/hooks/useActivity';
import type { Application, PaginatedResponse, SavedJob } from '@/types/api';
import {
  Search,
  FileText,
  Bookmark,
  Trophy,
  ArrowRight,
  MapPin,
  Briefcase,
  Clock3,
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';


const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
};

function displayName(username?: string) {
  if (!username) return 'there';
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function bookmarkCount(data: PaginatedResponse<SavedJob> | SavedJob[] | undefined) {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  return data.count ?? data.results?.length ?? 0;
}

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

function RecentApplicationRow({ application }: { application: Application }) {
  const location = application.job.is_remote ? 'Remote' : application.job.location;
  const jobType = JOB_TYPE_LABELS[application.job.job_type] ?? application.job.job_type;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 py-4 last:border-0">
      <div className="min-w-0">
        <p className="truncate font-semibold text-zinc-900">{application.job.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {jobType}
          </span>
        </div>
      </div>
      <Link
        href={`/jobs/${application.job.id}`}
        className="shrink-0 text-sm font-medium text-zinc-700 hover:text-zinc-950"
      >
        Details
      </Link>
    </div>
  );
}

export function DeveloperDashboard() {
  const { data: user, isLoading: userLoading } = useMe();
  const { data: appsData, isLoading: appsLoading } = useMyApplications();
  const { data: bookmarksData, isLoading: bookmarksLoading } = useBookmarks();
  const { data: activityData, isLoading: activityLoading } = useActivityLog();

  const applications = appsData?.results ?? [];
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .slice(0, 5);
  const activities = activityData?.results ?? [];
  const totalApplied = applications.length;
  const savedCount = bookmarkCount(bookmarksData);
  const achievementsCount = user?.achievements?.filter((a) => a.trim()).length ?? 0;
  const loading = userLoading || appsLoading || bookmarksLoading;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Candidate home
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          Welcome back, {displayName(user?.username)}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          Keep your profile strong, and move toward the opportunities that fit you best.
        </p>
      </div>

      <Link
        href="/jobs"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:p-6"
      >
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
              Search Opportunities
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Find jobs that match your skills and goals.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-2 text-sm font-medium text-white transition-colors group-hover:bg-zinc-800">
          Find Jobs
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/applications"
          className="rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-zinc-500">Total Applied</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {loading ? '—' : totalApplied}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
            View applications <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        <Link
          href="/bookmarks"
          className="rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <Bookmark className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-zinc-500">Saved Jobs</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {loading ? '—' : savedCount}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
            View bookmarks <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        <Link
          href="/profile#achievements"
          className="rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
            <Trophy className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-zinc-500">Achievements</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {loading ? '—' : achievementsCount}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
            Manage in profile <ArrowRight className="h-3 w-3" />
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent applications — left */}
        <section className="rounded-2xl border border-zinc-200 bg-white lg:col-span-3">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Recent applications</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Quick access to roles you recently applied for.
              </p>
            </div>
            <Link
              href="/applications"
              className="shrink-0 text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              View all
            </Link>
          </div>

          <div className="px-5 sm:px-6">
            {appsLoading ? (
              <div className="space-y-4 py-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Briefcase className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-zinc-900">No applications yet</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Apply to jobs and they will show up here.
                </p>
                <Link
                  href="/jobs"
                  className="mt-4 inline-flex rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Find Jobs
                </Link>
              </div>
            ) : (
              recentApplications.map((application) => (
                <RecentApplicationRow key={application.id} application={application} />
              ))
            )}
          </div>
        </section>

        {/* Recent activities — right */}
        <section className="rounded-2xl border border-zinc-200 bg-white lg:col-span-2">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-zinc-900">Recent activities</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Applications, bookmarks, profile updates, and security changes.
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
                  Updates will appear here as you apply, save jobs, and edit your profile.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {activities.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <UserAvatar
                      src={user?.avatar_url}
                      name={user?.username || 'User'}
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
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {displayName(user?.username)}
                        {user?.email ? ` · ${user.email}` : ''}
                      </p>
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
