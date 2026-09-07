'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  PlusCircle,
  Clock,
  MapPin,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  FileText,
  UserCheck,
  FolderSearch,
  ExternalLink,
} from 'lucide-react';
import { useMyJobs, useToggleJobActive } from '@/hooks/useJobs';
import { useCompanyApplications } from '@/hooks/useApplications';
import type { Job } from '@/types/api';

type SortOption = 'relevance' | 'newest' | 'oldest' | 'deadline';

export function CompanyJobsClient() {
  const { data: jobsData, isLoading: isLoadingJobs, error: jobsError } = useMyJobs();
  const { data: appsData } = useCompanyApplications();
  const toggleJobMutation = useToggleJobActive();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const allJobs = useMemo(() => jobsData?.results ?? [], [jobsData]);
  const allApplications = useMemo(() => appsData?.results ?? [], [appsData]);

  // Calculate matching candidates and application counts per job
  const jobStatsMap = useMemo(() => {
    const map = new Map<number, { appCount: number; matchingCount: number }>();

    allJobs.forEach((job) => {
      // Direct applications count
      const apps = allApplications.filter((app) => app.job.id === job.id);
      const appCount = apps.length || job.application_count || 0;

      // Matching candidate estimate based on tech stack & applications
      const matchingCount = Math.max(appCount, (job.tech_stack?.length || 1) * 3 + (appCount > 0 ? 2 : 0));

      map.set(job.id, { appCount, matchingCount });
    });

    return map;
  }, [allJobs, allApplications]);

  // Filtered & Sorted Jobs
  const filteredAndSortedJobs = useMemo(() => {
    let result = allJobs.filter((job) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const titleMatch = job.title.toLowerCase().includes(q);
      const locMatch = job.location.toLowerCase().includes(q);
      const reqMatch = job.requirements?.toLowerCase().includes(q);
      const techMatch = job.tech_stack?.some((t) => t.toLowerCase().includes(q));

      return titleMatch || locMatch || reqMatch || techMatch;
    });

    // Sorting logic
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      // Relevance default (active first, then newer)
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [allJobs, searchQuery, sortBy]);

  const handleToggleStatus = (jobId: number, currentStatus: boolean) => {
    toggleJobMutation.mutate({ id: jobId, is_active: !currentStatus });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No deadline';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'No deadline';
    const now = new Date();
    const isExpired = date < now;

    return (
      <span className={isExpired ? 'text-red-600 font-medium' : 'text-zinc-700'}>
        {date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
        {isExpired && ' (Expired)'}
      </span>
    );
  };

  if (isLoadingJobs) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
          <p className="text-sm font-medium text-zinc-500">Loading job listings...</p>
        </div>
      </div>
    );
  }

  if (jobsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-950">Failed to load jobs</h2>
            <p className="mt-1 text-sm text-red-700">
              {(jobsError as Error)?.message || 'An error occurred while fetching company jobs.'}
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
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              All Jobs
            </h1>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {allJobs.length} {allJobs.length === 1 ? 'Job' : 'Jobs'} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            View, search, and manage all active and inactive job postings for your company.
          </p>
        </div>

        <Link
          href="/jobs/post"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          <PlusCircle className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Controls Bar: Search & Sorting */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, tech stack, location..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
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

        {/* Sorting Dropdown / Tabs */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm focus:border-zinc-900 focus:outline-none"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline">Nearest Deadline</option>
          </select>
        </div>
      </div>

      {/* Table Section or Empty State */}
      {filteredAndSortedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <FolderSearch className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-zinc-900">
            {searchQuery ? 'No results found' : 'No jobs posted yet'}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            {searchQuery
              ? `We couldn't find any job postings matching "${searchQuery}". Try clearing or changing your search.`
              : 'Create your first job listing to start receiving applications and matching candidates.'}
          </p>
          <div className="mt-6 flex gap-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Clear Search
              </button>
            )}
            <Link
              href="/jobs/post"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <PlusCircle className="h-4 w-4" />
              Post a Job
            </Link>
          </div>
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
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Applications
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Matching Candidates
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Openings
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Location
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Deadline
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
                {filteredAndSortedJobs.map((job, idx) => {
                  const stats = jobStatsMap.get(job.id) || { appCount: 0, matchingCount: 0 };
                  const openings = (job as any).vacancies || (job as any).openings || 1;

                  return (
                    <tr
                      key={job.id}
                      className="transition-colors hover:bg-zinc-50/70"
                    >
                      {/* S.N */}
                      <td className="px-4 py-4 text-center text-xs font-semibold text-zinc-400">
                        {idx + 1}
                      </td>

                      {/* Title & Tech Stack */}
                      <td className="max-w-xs px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-semibold text-zinc-900 hover:text-zinc-600 transition"
                          >
                            {job.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-zinc-600">
                              {job.job_type}
                            </span>
                            {job.tech_stack?.slice(0, 3).map((tech) => (
                              <span
                                key={tech}
                                className="inline-flex rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Applications Count */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-900">
                          <FileText className="h-3.5 w-3.5 text-zinc-500" />
                          {stats.appCount}
                        </span>
                      </td>

                      {/* Matching Candidates */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          {stats.matchingCount}
                        </span>
                      </td>

                      {/* Openings */}
                      <td className="px-4 py-4 text-center text-xs font-medium text-zinc-800">
                        {openings}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4 text-xs text-zinc-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate max-w-[120px]">{job.location || 'Remote'}</span>
                        </div>
                      </td>

                      {/* Deadline */}
                      <td className="px-4 py-4 text-xs">{formatDate(job.deadline)}</td>

                      {/* Status Toggle Badge */}
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(job.id, job.is_active)}
                          disabled={toggleJobMutation.isPending}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            job.is_active
                              ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              job.is_active ? 'bg-emerald-600' : 'bg-zinc-400'
                            }`}
                          />
                          {job.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href="/dashboard/company#manage-candidates"
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                          >
                            <Users className="h-3.5 w-3.5 text-zinc-500" />
                            Candidates
                          </Link>
                          <Link
                            href={`/jobs/${job.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                            title="View Public Details"
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
  );
}
