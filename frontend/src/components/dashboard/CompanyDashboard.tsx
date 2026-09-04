'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMyJobs } from '@/hooks/useJobs';
import { useCompanyApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { StatusBadge } from './StatusBadge';
import type { ApplicationStatus } from '@/types/api';
import {
  Briefcase,
  Users,
  ExternalLink,
  FileText,
  Mail,
  GitBranch,
  Globe,
  MapPin,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';


export function CompanyDashboard() {
  const { data: jobsData, isLoading: isLoadingJobs, error: jobsError } = useMyJobs();
  const { data: appsData, isLoading: isLoadingApps, error: appsError } = useCompanyApplications();
  const updateStatusMutation = useUpdateApplicationStatus();

  const jobs = useMemo(() => jobsData?.results ?? [], [jobsData]);
  const allApplications = useMemo(() => appsData?.results ?? [], [appsData]);

  // Selected job state
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Local notes state per application
  const [notesState, setNotesState] = useState<Record<number, string>>({});

  // Track save success states for candidates
  const [saveSuccess, setSaveSuccess] = useState<Record<number, boolean>>({});

  // Filter state for jobs list search
  const [jobSearchQuery, setJobSearchQuery] = useState('');

  // Automatically select the first job if none selected
  useEffect(() => {
    if (jobs.length > 0 && selectedJobId === null) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  // Initialize notes state from applications
  useEffect(() => {
    if (allApplications.length > 0) {
      const initialNotes: Record<number, string> = {};
      allApplications.forEach((app) => {
        initialNotes[app.id] = app.notes || '';
      });
      setNotesState(initialNotes);
    }
  }, [allApplications]);

  // Filtered jobs list based on search query
  const filteredJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(jobSearchQuery.toLowerCase())
    );
  }, [jobs, jobSearchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.is_active).length;
    const totalApplicants = allApplications.length;

    // Applications in last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyApplications = allApplications.filter(
      (app) => new Date(app.applied_at) >= oneWeekAgo
    ).length;

    // Acceptance rate
    const acceptedCount = allApplications.filter((app) => app.status === 'accepted').length;
    const acceptanceRate =
      totalApplicants > 0 ? Math.round((acceptedCount / totalApplicants) * 100) : 0;

    return {
      activeJobs,
      totalJobs,
      totalApplicants,
      weeklyApplications,
      acceptanceRate,
    };
  }, [jobs, allApplications]);

  // Find currently selected job
  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // Get applications for the selected job
  const selectedJobApplications = useMemo(() => {
    if (selectedJobId === null) return [];
    return allApplications.filter((app) => app.job.id === selectedJobId);
  }, [allApplications, selectedJobId]);

  const handleUpdateStatus = (appId: number, status: ApplicationStatus) => {
    updateStatusMutation.mutate(
      { id: appId, status, notes: notesState[appId] },
      {
        onSuccess: () => {
          setSaveSuccess((prev) => ({ ...prev, [appId]: true }));
          setTimeout(() => {
            setSaveSuccess((prev) => ({ ...prev, [appId]: false }));
          }, 3000);
        },
      }
    );
  };

  const handleSaveNotes = (appId: number) => {
    const app = allApplications.find((a) => a.id === appId);
    if (!app) return;

    updateStatusMutation.mutate(
      { id: appId, status: app.status, notes: notesState[appId] },
      {
        onSuccess: () => {
          setSaveSuccess((prev) => ({ ...prev, [appId]: true }));
          setTimeout(() => {
            setSaveSuccess((prev) => ({ ...prev, [appId]: false }));
          }, 3000);
        },
      }
    );
  };

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Employer Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Manage Candidates
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review job applications, evaluate talent, and update candidate statuses.
          </p>
        </div>
        <Link href="/jobs/post" className="shrink-0">
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 sm:w-auto">
            <Plus className="h-4 w-4" />
            Post New Job
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Active Jobs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{stats.activeJobs}</p>
          <p className="mt-1 text-xs text-zinc-400">of {stats.totalJobs} total posted jobs</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Total Applicants</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-700">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{stats.totalApplicants}</p>
          <p className="mt-1 text-xs text-zinc-400">Across all job postings</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">New This Week</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">+{stats.weeklyApplications}</p>
          <p className="mt-1 text-xs text-zinc-400">Applications in last 7 days</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Acceptance Rate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{stats.acceptanceRate}%</p>
          <p className="mt-1 text-xs text-zinc-400">Accepted candidate ratio</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Jobs Selector Sidebar */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-zinc-900">
                My Job Postings ({filteredJobs.length})
              </h2>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={jobSearchQuery}
                onChange={(e) => setJobSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-950/5"
              />
            </div>

            <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1">
              {filteredJobs.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-zinc-500">No matching jobs found</p>
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const isSelected = job.id === selectedJobId;
                  const jobApps = allApplications.filter((a) => a.job.id === job.id);
                  return (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`group relative w-full rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                          : 'border-zinc-200/80 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`truncate text-sm font-semibold ${
                              isSelected ? 'text-white' : 'text-zinc-900'
                            }`}
                          >
                            {job.title}
                          </h3>
                          <p
                            className={`mt-1 text-xs ${
                              isSelected ? 'text-zinc-300' : 'text-zinc-500'
                            }`}
                          >
                            {job.location}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            job.is_active
                              ? isSelected
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isSelected
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              job.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
                            }`}
                          />
                          {job.is_active ? 'Active' : 'Closed'}
                        </span>
                      </div>

                      <div
                        className={`mt-3 flex items-center justify-between border-t pt-2.5 text-xs ${
                          isSelected ? 'border-zinc-800 text-zinc-300' : 'border-zinc-100 text-zinc-500'
                        }`}
                      >
                        <span className="font-medium">{jobApps.length} candidates</span>
                        <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Candidate Applications Management */}
        <div className="space-y-4 lg:col-span-8">
          {selectedJob ? (
            <>
              {/* Selected Job Header Banner */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-zinc-900">{selectedJob.title}</h2>
                      <Link
                        href={`/jobs/${selectedJob.id}`}
                        className="text-zinc-400 transition hover:text-zinc-900"
                        title="View public job post"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" /> {selectedJob.location}
                      </span>
                      <span className="font-medium capitalize">
                        {selectedJob.job_type.replace('-', ' ')}
                      </span>
                      <span className="font-medium text-zinc-700">
                        {selectedJob.salary_min && selectedJob.salary_max
                          ? `$${selectedJob.salary_min.toLocaleString()} – $${selectedJob.salary_max.toLocaleString()}`
                          : 'Salary not specified'}
                      </span>
                    </div>

                    {selectedJob.tech_stack && selectedJob.tech_stack.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {selectedJob.tech_stack.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                    {selectedJob.experience_level}
                  </span>
                </div>
              </div>

              {/* Candidate Cards List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900">
                    Candidates ({selectedJobApplications.length})
                  </h3>
                </div>

                {selectedJobApplications.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-base font-semibold text-zinc-900">No applications received yet</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      When candidates apply to this job position, they will appear here.
                    </p>
                  </div>
                ) : (
                  selectedJobApplications.map((application) => {
                    const dev = application.developer;
                    const appliedDate = new Date(application.applied_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <div
                        key={application.id}
                        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition-all hover:border-zinc-300 hover:shadow-md"
                      >
                        {/* Candidate Card Header */}
                        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <UserAvatar
                              src={dev.avatar_url}
                              name={dev.username || 'Candidate'}
                              size="lg"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-base font-bold text-zinc-900">
                                  <Link
                                    href={`/profile/${dev.username}`}
                                    className="transition hover:text-zinc-600"
                                  >
                                    {dev.username}
                                  </Link>
                                </h4>
                              </div>

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                                <span className="flex items-center gap-1 font-medium text-zinc-600">
                                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                                  {dev.email}
                                </span>
                                {dev.github_url && (
                                  <a
                                    href={dev.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 font-medium text-zinc-600 transition hover:text-zinc-950"
                                  >
                                    <GitBranch className="h-3.5 w-3.5 text-zinc-400" /> GitHub
                                  </a>
                                )}
                                {dev.portfolio_url && (
                                  <a
                                    href={dev.portfolio_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 font-medium text-zinc-600 transition hover:text-zinc-950"
                                  >
                                    <Globe className="h-3.5 w-3.5 text-zinc-400" /> Portfolio
                                  </a>
                                )}
                                <Link
                                  href={`/profile/${dev.username}`}
                                  className="flex items-center gap-1 font-semibold text-zinc-900 transition hover:underline"
                                >
                                  <Users className="h-3.5 w-3.5" /> Full Profile
                                </Link>
                              </div>

                              <p className="mt-1.5 flex items-center gap-1 text-xs text-zinc-400">
                                <Clock className="h-3 w-3" /> Applied on {appliedDate}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 self-start sm:self-auto">
                            <StatusBadge status={application.status} />
                          </div>
                        </div>

                        {/* Bio & Skills */}
                        {(dev.bio || (dev.skills && dev.skills.length > 0)) && (
                          <div className="py-4 space-y-3">
                            {dev.bio && (
                              <p className="text-sm leading-relaxed text-zinc-600">{dev.bio}</p>
                            )}
                            {dev.skills && dev.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {dev.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cover Letter & Resume attachment */}
                        {(application.cover_letter || application.resume_url) && (
                          <div className="my-3 space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4">
                            {application.cover_letter && (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Cover Letter
                                </p>
                                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">
                                  {application.cover_letter}
                                </p>
                              </div>
                            )}
                            {application.resume_url && (
                              <div className={application.cover_letter ? 'border-t border-zinc-200/60 pt-3' : ''}>
                                <a
                                  href={application.resume_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-900 transition hover:underline"
                                >
                                  <FileText className="h-4 w-4 text-zinc-700" />
                                  Download Attached Resume / CV
                                  <ExternalLink className="h-3 w-3 text-zinc-400" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status update & Internal Notes controls */}
                        <div className="mt-4 border-t border-zinc-100 pt-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                            <div className="sm:col-span-4">
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Application Status
                              </label>
                              <select
                                value={application.status}
                                onChange={(e) =>
                                  handleUpdateStatus(
                                    application.id,
                                    e.target.value as ApplicationStatus
                                  )
                                }
                                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-950/5"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>

                            <div className="sm:col-span-8">
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Internal Notes
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Add evaluation notes..."
                                  value={notesState[application.id] || ''}
                                  onChange={(e) =>
                                    setNotesState((prev) => ({
                                      ...prev,
                                      [application.id]: e.target.value,
                                    }))
                                  }
                                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-950/5"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveNotes(application.id)}
                                  disabled={updateStatusMutation.isPending}
                                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                                >
                                  {updateStatusMutation.isPending &&
                                  updateStatusMutation.variables?.id === application.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : saveSuccess[application.id] ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                      Saved
                                    </>
                                  ) : (
                                    'Save Notes'
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                <Briefcase className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-zinc-900">Select a job posting</p>
              <p className="mt-1 text-sm text-zinc-500">
                Click a job on the left panel to review its applications and candidates.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
