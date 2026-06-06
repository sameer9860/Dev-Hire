'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMyJobs } from '@/hooks/useJobs';
import { useCompanyApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import Link from 'next/link';

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
    return jobs.filter((job) =>
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
    const acceptanceRate = totalApplicants > 0 
      ? Math.round((acceptedCount / totalApplicants) * 100) 
      : 0;

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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Unable to load dashboard</p>
              <p className="text-sm text-red-700 mt-1">
                {((jobsError || appsError) as Error)?.message || 'Please try again.'}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Manage Candidates</h1>
          <p className="text-gray-600 mt-1">Review applications and update candidate status</p>
        </div>
        <Link href="/jobs/post">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Post Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 hover:shadow-lg hover:bg-blue-100 transition-all cursor-pointer">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-700 mb-2">Active Jobs</p>
            <p className="text-3xl font-bold text-blue-900">{stats.activeJobs}</p>
            <p className="text-xs text-blue-600 mt-1">of {stats.totalJobs} total</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 hover:shadow-lg hover:bg-purple-100 transition-all cursor-pointer">
          <CardContent className="pt-6">
            <p className="text-sm text-purple-700 mb-2">Total Candidates</p>
            <p className="text-3xl font-bold text-purple-900">{stats.totalApplicants}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 hover:shadow-lg hover:bg-green-100 transition-all cursor-pointer">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700 mb-2">New This Week</p>
            <p className="text-3xl font-bold text-green-900">+{stats.weeklyApplications}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 hover:shadow-lg hover:bg-orange-100 transition-all cursor-pointer">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-700 mb-2">Acceptance Rate</p>
            <p className="text-3xl font-bold text-orange-900">{stats.acceptanceRate}%</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Jobs List */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <h2 className="font-bold text-lg mb-3">My Jobs</h2>
            <input
              type="text"
              placeholder="Search jobs..."
              value={jobSearchQuery}
              onChange={(e) => setJobSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredJobs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No jobs found</p>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                const jobApps = allApplications.filter((a) => a.job.id === job.id);
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-100 shadow-lg'
                        : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{job.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{job.location}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                          job.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {job.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{jobApps.length} candidates</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Applications */}
        <div className="lg:col-span-8 space-y-4">
          {selectedJob ? (
            <>
              {/* Job Header */}
              <Card className="bg-indigo-50 hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-indigo-900">{selectedJob.title}</h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-indigo-700">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {selectedJob.location}
                        </span>
                        <span className="capitalize">
                          {selectedJob.job_type.replace('-', ' ')}
                        </span>
                        <span>
                          {selectedJob.salary_min && selectedJob.salary_max
                            ? `$${selectedJob.salary_min.toLocaleString()} - $${selectedJob.salary_max.toLocaleString()}`
                            : 'Not specified'}
                        </span>
                      </div>
                      {selectedJob.tech_stack && selectedJob.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {selectedJob.tech_stack.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-indigo-200 text-indigo-700 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold bg-indigo-200 text-indigo-700 px-3 py-1 rounded-full">
                      {selectedJob.experience_level}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Candidates */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg">
                  Candidates ({selectedJobApplications.length})
                </h3>

                {selectedJobApplications.length === 0 ? (
                  <Card className="bg-gray-50 hover:shadow-lg transition-all">
                    <CardContent className="pt-6 text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No applications yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  selectedJobApplications.map((application, index) => {
                    const dev = application.developer;
                    const appliedDate = new Date(application.applied_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    
                    const colors = [
                      'bg-cyan-50 hover:bg-cyan-100',
                      'bg-rose-50 hover:bg-rose-100',
                      'bg-amber-50 hover:bg-amber-100',
                      'bg-teal-50 hover:bg-teal-100',
                      'bg-violet-50 hover:bg-violet-100',
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <Card key={application.id} className={`${colorClass} hover:shadow-lg transition-all`}>
                        <CardContent className="pt-6">
                          {/* Header */}
                          <div className="flex items-start gap-4 pb-4 border-b">
                            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {dev.username?.substring(0, 2).toUpperCase() || 'DV'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm">
                                <Link href={`/profile/${dev.username}`} className="hover:underline hover:text-blue-600 transition-colors">
                                  {dev.username}
                                </Link>
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {dev.email}
                                </span>
                                <Link
                                  href={`/profile/${dev.username}`}
                                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                                >
                                  <Users className="h-3 w-3" /> View Public Profile
                                </Link>
                                {dev.github_url && (
                                  <a
                                    href={dev.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <GitBranch className="h-3 w-3" /> GitHub
                                  </a>
                                )}
                                {dev.portfolio_url && (
                                  <a
                                    href={dev.portfolio_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <Globe className="h-3 w-3" /> Portfolio
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Applied {appliedDate}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <StatusBadge status={application.status} />
                            </div>
                          </div>

                          {/* Bio & Skills */}
                          {(dev.bio || dev.skills?.length) && (
                            <div className="py-3 space-y-3">
                              {dev.bio && (
                                <p className="text-sm text-gray-700">{dev.bio}</p>
                              )}
                              {dev.skills && dev.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {dev.skills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cover Letter & Resume */}
                          {(application.cover_letter || application.resume_url) && (
                            <div className="py-3 space-y-3 border-t">
                              {application.cover_letter && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 mb-2">
                                    Cover Letter
                                  </p>
                                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-line">
                                    {application.cover_letter}
                                  </p>
                                </div>
                              )}
                              {application.resume_url && (
                                <a
                                  href={application.resume_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                  <FileText className="h-4 w-4" />
                                  View Resume
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="pt-3 border-t space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <select
                                value={application.status}
                                onChange={(e) =>
                                  handleUpdateStatus(
                                    application.id,
                                    e.target.value as ApplicationStatus
                                  )
                                }
                                className="w-full min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                              <textarea
                                rows={1}
                                placeholder="Add notes..."
                                value={notesState[application.id] || ''}
                                onChange={(e) =>
                                  setNotesState((prev) => ({
                                    ...prev,
                                    [application.id]: e.target.value,
                                  }))
                                }
                                className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(application.id)}
                                disabled={updateStatusMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              >
                                {updateStatusMutation.isPending &&
                                updateStatusMutation.variables?.id === application.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : saveSuccess[application.id] ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              {saveSuccess[application.id] && (
                                <span className="text-xs text-green-700">Saved</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <Card className="bg-gray-50 hover:shadow-lg transition-all">
              <CardContent className="pt-6 text-center">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Select a job to view candidates</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
