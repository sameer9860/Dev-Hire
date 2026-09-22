'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  ArrowUpDown,
  ExternalLink,
  Loader2,
  AlertCircle,
  FolderSearch,
  Bookmark,
  FileDown,
  Briefcase,
  X,
} from 'lucide-react';
import { useCompanyApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { useMyJobs } from '@/hooks/useJobs';
import { UserAvatar } from '@/components/UserAvatar';
import type { ApplicationStatus } from '@/types/api';

type FilterTab = 'all' | ApplicationStatus | 'saved';
type SortOption = 'newest' | 'oldest' | 'name';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'accepted', label: 'Interviewed / Accepted' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'saved', label: 'Saved' },
];

export function CompanyApplicationsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as FilterTab) || 'all';
  const jobParam = searchParams.get('job');
  const selectedJobId = jobParam ? parseInt(jobParam, 10) : null;

  const { data: appsData, isLoading, error } = useCompanyApplications();
  const { data: jobsData, isLoading: jobsLoading } = useMyJobs();
  const updateStatusMutation = useUpdateApplicationStatus();

  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [savedApps, setSavedApps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const tabParam = searchParams.get('tab') as FilterTab;
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const updateUrl = useCallback(
    (next: { tab?: FilterTab | null; job?: number | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.tab !== undefined) {
        if (next.tab && next.tab !== 'all') params.set('tab', next.tab);
        else params.delete('tab');
      }
      if (next.job !== undefined) {
        if (next.job) params.set('job', String(next.job));
        else params.delete('job');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const allApplications = useMemo(() => appsData?.results ?? [], [appsData]);
  const companyJobs = useMemo(() => jobsData?.results ?? [], [jobsData]);

  const jobApplicantCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    allApplications.forEach((app) => {
      counts[app.job.id] = (counts[app.job.id] || 0) + 1;
    });
    return counts;
  }, [allApplications]);

  const jobsWithApplicants = useMemo(() => {
    const fromJobs = companyJobs.map((job) => ({
      id: job.id,
      title: job.title,
      is_active: job.is_active,
      count: jobApplicantCounts[job.id] ?? job.application_count ?? 0,
    }));

    if (fromJobs.length > 0) {
      return [...fromJobs].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
    }

    const seen = new Map<number, { id: number; title: string; is_active: boolean; count: number }>();
    allApplications.forEach((app) => {
      const existing = seen.get(app.job.id);
      if (existing) {
        existing.count += 1;
      } else {
        seen.set(app.job.id, {
          id: app.job.id,
          title: app.job.title,
          is_active: app.job.is_active,
          count: 1,
        });
      }
    });
    return Array.from(seen.values()).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  }, [companyJobs, allApplications, jobApplicantCounts]);

  const selectedJob = useMemo(
    () => (selectedJobId ? jobsWithApplicants.find((j) => j.id === selectedJobId) : null),
    [selectedJobId, jobsWithApplicants]
  );

  const applicationsForJob = useMemo(() => {
    if (!selectedJobId) return allApplications;
    return allApplications.filter((app) => app.job.id === selectedJobId);
  }, [allApplications, selectedJobId]);

  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      all: applicationsForJob.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      saved: 0,
    };

    applicationsForJob.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status] += 1;
      }
      if (savedApps[app.id]) {
        counts.saved += 1;
      }
    });

    return counts;
  }, [applicationsForJob, savedApps]);

  const filteredApplications = useMemo(() => {
    let result = applicationsForJob.filter((app) => {
      if (activeTab === 'saved') {
        if (!savedApps[app.id]) return false;
      } else if (activeTab !== 'all') {
        if (app.status !== activeTab) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const devName = (app.developer?.username || '').toLowerCase();
      const devEmail = (app.developer?.email || '').toLowerCase();
      const devHeadline = (app.developer?.headline || '').toLowerCase();
      const jobTitle = (app.job?.title || '').toLowerCase();
      const devSkills = (app.developer?.skills || []).some((s) => s.toLowerCase().includes(q));

      return (
        devName.includes(q) ||
        devEmail.includes(q) ||
        devHeadline.includes(q) ||
        jobTitle.includes(q) ||
        devSkills
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
      }
      if (sortBy === 'name') {
        const nameA = a.developer?.username || '';
        const nameB = b.developer?.username || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [applicationsForJob, activeTab, searchQuery, sortBy, savedApps]);

  const handleStatusChange = (appId: number, newStatus: ApplicationStatus) => {
    updateStatusMutation.mutate({ id: appId, status: newStatus });
  };

  const toggleSaveApp = (appId: number) => {
    setSavedApps((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    updateUrl({ tab });
  };

  const handleJobSelect = (jobId: number | null) => {
    updateUrl({ job: jobId });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading || jobsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
          <p className="text-sm font-medium text-zinc-500">Loading candidate applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-950">Failed to load applications</h2>
            <p className="mt-1 text-sm text-red-700">
              {(error as Error)?.message || 'An error occurred while fetching candidate applications.'}
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
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Candidates & Applicants
            </h1>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {applicationsForJob.length}{' '}
              {selectedJob ? 'for this role' : 'Total Candidates'}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {selectedJob
              ? `Applicants for “${selectedJob.title}”. Select another role in the sidebar to switch.`
              : 'Filter by job role in the sidebar, then review qualifications and update pipeline status.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-bold text-zinc-900">Job Roles</h2>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                View applicants for a specific posting
              </p>
            </div>

            <div className="max-h-[min(70vh,560px)] space-y-1 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => handleJobSelect(null)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  !selectedJobId
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span className="truncate font-semibold">All roles</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    !selectedJobId ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {allApplications.length}
                </span>
              </button>

              {jobsWithApplicants.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-zinc-500">
                  No job roles yet. Post a job to start receiving applicants.
                </p>
              ) : (
                jobsWithApplicants.map((job) => {
                  const isActive = selectedJobId === job.id;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => handleJobSelect(job.id)}
                      className={`flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive
                          ? 'bg-zinc-950 text-white shadow-sm'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            isActive ? 'text-white' : 'text-zinc-900'
                          }`}
                        >
                          {job.title}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] ${
                            isActive ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {job.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {job.count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-4 lg:col-span-3">
          {selectedJob && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <Users className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="truncate font-semibold text-zinc-900">{selectedJob.title}</span>
                <span className="shrink-0 text-zinc-500">· {selectedJob.count} applicants</span>
              </div>
              <button
                type="button"
                onClick={() => handleJobSelect(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  {tab.key === 'saved' && (
                    <Bookmark
                      className={`h-3.5 w-3.5 ${
                        isActive ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'
                      }`}
                    />
                  )}
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, skills, headline..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-zinc-700"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm focus:border-zinc-900 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Candidate Name (A-Z)</option>
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <FolderSearch className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900">No candidate applications found</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                {searchQuery
                  ? `No applicants matching "${searchQuery}" in this view.`
                  : selectedJob
                    ? 'No applicants for this job role under the current filters.'
                    : 'There are currently no candidate applications under this tab filter.'}
              </p>
              {(searchQuery || selectedJob) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    if (selectedJob) handleJobSelect(null);
                  }}
                  className="mt-6 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  {searchQuery ? 'Clear Search' : 'Show All Roles'}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 text-center">
                        S.N
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Candidate
                      </th>
                      {!selectedJobId && (
                        <th scope="col" className="px-4 py-3.5">
                          Applied For
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3.5">
                        Applied Date
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-center">
                        Status Pipeline
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-center">
                        Resume
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
                    {filteredApplications.map((app, idx) => {
                      const dev = app.developer;
                      const isSaved = !!savedApps[app.id];

                      return (
                        <tr key={app.id} className="transition-colors hover:bg-zinc-50/70">
                          <td className="px-4 py-4 text-center text-xs font-semibold text-zinc-400">
                            {idx + 1}
                          </td>

                          <td className="max-w-xs px-5 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar src={dev?.avatar_url} name={dev?.username} size="md" />
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/profile/${dev?.username}`}
                                  className="block truncate font-semibold text-zinc-900 transition hover:text-zinc-600"
                                >
                                  {dev?.username}
                                </Link>
                                {dev?.headline && (
                                  <p className="truncate text-xs text-zinc-500">{dev.headline}</p>
                                )}
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {dev?.skills?.slice(0, 3).map((skill) => (
                                    <span
                                      key={skill}
                                      className="inline-flex rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>

                          {!selectedJobId && (
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => handleJobSelect(app.job.id)}
                                  className="text-left text-xs font-semibold text-zinc-900 transition hover:text-zinc-600"
                                >
                                  {app.job.title}
                                </button>
                                <span className="text-[11px] text-zinc-500">
                                  {app.job.is_remote ? 'Remote' : app.job.location}
                                </span>
                              </div>
                            </td>
                          )}

                          <td className="px-4 py-4 text-xs text-zinc-600">
                            {formatDate(app.applied_at)}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusChange(app.id, e.target.value as ApplicationStatus)
                              }
                              disabled={updateStatusMutation.isPending}
                              className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-sm focus:border-zinc-900 focus:outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="accepted">Interviewed / Accepted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>

                          <td className="px-4 py-4 text-center">
                            {app.resume_url ? (
                              <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
                              >
                                <FileDown className="h-3.5 w-3.5 text-zinc-500" />
                                Resume
                              </a>
                            ) : (
                              <span className="text-xs text-zinc-400">N/A</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/dashboard/company/applications/${app.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
                              >
                                Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => toggleSaveApp(app.id)}
                                className={`rounded-lg border p-1.5 transition ${
                                  isSaved
                                    ? 'border-amber-200 bg-amber-50 text-amber-600'
                                    : 'border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
                                }`}
                                title={isSaved ? 'Remove from Saved' : 'Save Candidate'}
                              >
                                <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-amber-500' : ''}`} />
                              </button>
                              <Link
                                href={`/profile/${dev?.username}`}
                                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                                title="View Full Profile"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
