'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMyJobs } from '@/hooks/useJobs';
import { useCompanyApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import type { ApplicationStatus } from '@/types/api';
import {
  Briefcase,
  Users,
  TrendingUp,
  Percent,
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
  ChevronRight,
  MessageSquare,
  Sparkles,
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
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-500 font-medium animate-pulse">Loading dashboard workspace...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <Card className="max-w-xl mx-auto mt-12 border-rose-200 bg-rose-50/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>Unable to load company data</CardTitle>
          </div>
          <CardDescription className="text-rose-700 mt-2">
            {((jobsError || appsError) as Error)?.message || 'An unexpected error occurred. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-blue-500/25 px-2.5 py-1 rounded-full text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Recruiting Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Manage Candidates
          </h1>
          <p className="text-slate-300 font-medium">
            Review job applicants, change statuses, and log review comments.
          </p>
        </div>
        
        <div className="relative z-10">
          <Link href="/jobs/post">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-md px-6 py-2.5 rounded-xl border border-blue-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" /> Post a New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Active Jobs */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50/70 to-blue-50/30 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Briefcase className="h-24 w-24 text-indigo-900" />
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Active Postings</span>
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.activeJobs}</span>
              <span className="text-xs text-slate-500 font-medium">of {stats.totalJobs} total</span>
            </div>
          </CardContent>
        </Card>

        {/* Stat 2: Total Candidates */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/70 to-indigo-50/30 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users className="h-24 w-24 text-blue-900" />
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Total Candidates</span>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.totalApplicants}</span>
              <span className="text-xs text-slate-500 font-medium">applications</span>
            </div>
          </CardContent>
        </Card>

        {/* Stat 3: New This Week */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50/70 to-indigo-50/30 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-24 w-24 text-violet-900" />
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Growth (This Week)</span>
              <div className="p-2 bg-violet-500/10 rounded-lg text-violet-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">+{stats.weeklyApplications}</span>
              <span className="text-xs text-slate-500 font-medium">new candidates</span>
            </div>
          </CardContent>
        </Card>

        {/* Stat 4: Acceptance Rate */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50/70 to-teal-50/30 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Percent className="h-24 w-24 text-emerald-900" />
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Acceptance Rate</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.acceptanceRate}%</span>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-100/50 px-1.5 py-0.5 rounded">Target Achieved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Jobs List Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Posted Jobs <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">{filteredJobs.length}</span>
            </h2>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search postings..."
              value={jobSearchQuery}
              onChange={(e) => setJobSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredJobs.length === 0 ? (
              <Card className="p-6 text-center border-dashed border-2 border-slate-200 bg-white">
                <p className="text-slate-500 text-sm">No postings match your search.</p>
              </Card>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                const jobApps = allApplications.filter((a) => a.job.id === job.id);
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                        : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-950'}`}>
                        {job.title}
                      </h3>
                      {job.is_active ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md uppercase">
                          Closed
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Users className="h-3.5 w-3.5" />
                        <span>{jobApps.length} candidates</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Applicant Manager Panel */}
        <div className="lg:col-span-8 space-y-6">
          {selectedJob ? (
            <div className="space-y-6">
              {/* Selected Job Header Card */}
              <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Currently Inspecting Candidates for</span>
                    <CardTitle className="text-xl font-bold text-slate-900 mt-0.5">{selectedJob.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize bg-white text-slate-700">
                      {selectedJob.experience_level} Level
                    </Badge>
                    <Badge variant="outline" className="bg-white text-slate-700">
                      {selectedJob.is_remote ? 'Remote' : 'On-Site'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] block">Location</span>
                      <span className="font-medium text-slate-800 text-sm mt-0.5 block">{selectedJob.location}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] block">Job Type</span>
                      <span className="font-medium text-slate-800 text-sm mt-0.5 block capitalize">{selectedJob.job_type.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] block">Compensation Range</span>
                      <span className="font-medium text-slate-800 text-sm mt-0.5 block">
                        {selectedJob.salary_min && selectedJob.salary_max 
                          ? `$${selectedJob.salary_min.toLocaleString()} - $${selectedJob.salary_max.toLocaleString()}`
                          : 'Not Specified'}
                      </span>
                    </div>
                  </div>

                  {selectedJob.tech_stack && selectedJob.tech_stack.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] block mb-2">Required Stack</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.tech_stack.map((tag) => (
                          <span key={tag} className="text-[10px] font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Applicant list for selected job */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                  Candidates ({selectedJobApplications.length})
                </h3>

                {selectedJobApplications.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-2 border-slate-200 bg-white">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-800 text-base mb-1">No Applications Yet</h4>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      There are currently no developers who have applied to this job listing. When they do, they will show up here.
                    </p>
                  </Card>
                ) : (
                  selectedJobApplications.map((application) => {
                    const dev = application.developer;
                    const initials = dev.username ? dev.username.substring(0, 2).toUpperCase() : 'DV';
                    const appliedDateStr = new Date(application.applied_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <Card key={application.id} className="border-slate-100 shadow-sm bg-white overflow-hidden hover:border-slate-200 transition-all">
                        {/* Candidate Top Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/20">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-md shadow-inner flex-shrink-0">
                                {initials}
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-md font-black text-slate-900">{dev.username}</h4>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Applied {appliedDateStr}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {dev.email}
                                  </span>
                                  {dev.github_url && (
                                    <a href={dev.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                                      <GitBranch className="h-3.5 w-3.5 text-slate-400" /> GitHub
                                    </a>
                                  )}
                                  {dev.portfolio_url && (
                                    <a href={dev.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                                      <Globe className="h-3.5 w-3.5 text-slate-400" /> Portfolio
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start">
                              <StatusBadge status={application.status} />
                            </div>
                          </div>

                          {dev.bio && (
                            <p className="mt-4 text-slate-600 text-xs leading-relaxed bg-white border border-slate-100 rounded-lg p-3">
                              {dev.bio}
                            </p>
                          )}

                          {dev.skills && dev.skills.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {dev.skills.map((skill) => (
                                <span key={skill} className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Candidate Body (Cover letter, links, etc.) */}
                        <div className="p-6 space-y-5">
                          {application.cover_letter && (
                            <div className="space-y-1.5">
                              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] block">Cover Letter</span>
                              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 whitespace-pre-line">
                                {application.cover_letter}
                              </div>
                            </div>
                          )}

                          {application.resume_url && (
                            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                              <div className="flex items-center gap-2 text-slate-700 text-xs">
                                <FileText className="h-4.5 w-4.5 text-blue-600" />
                                <span className="font-semibold">Candidate Resume Document</span>
                              </div>
                              <a 
                                href={application.resume_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                              >
                                View CV <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}

                          {/* Hiring Review Box */}
                          <div className="pt-4 border-t border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                              <MessageSquare className="h-4 w-4 text-indigo-600" />
                              <span>Recruiter Decision Console</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1 space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hiring Status</label>
                                <select
                                  value={application.status}
                                  onChange={(e) => handleUpdateStatus(application.id, e.target.value as ApplicationStatus)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="reviewing">Reviewing</option>
                                  <option value="shortlisted">Shortlisted</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>
                              <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Internal Interview Notes</label>
                                <div className="flex gap-2">
                                  <textarea
                                    rows={1}
                                    placeholder="Write details of interviews or review comments..."
                                    value={notesState[application.id] || ''}
                                    onChange={(e) => setNotesState((prev) => ({ ...prev, [application.id]: e.target.value }))}
                                    className="flex-1 min-h-[34px] resize-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveNotes(application.id)}
                                    disabled={updateStatusMutation.isPending}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 rounded-lg flex-shrink-0"
                                  >
                                    {updateStatusMutation.isPending && updateStatusMutation.variables?.id === application.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : saveSuccess[application.id] ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                      'Save'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {saveSuccess[application.id] && (
                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md w-fit">
                                <CheckCircle2 className="h-3 w-3" /> Candidates details updated successfully.
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed border-2 border-slate-200 bg-white">
              <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">No Job Listing Selected</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Please select a job from the list on the left to inspect its candidates and manage application statuses.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
