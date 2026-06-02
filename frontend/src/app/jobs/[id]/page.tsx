'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useJob } from '@/hooks/useJobs';
import { useMe } from '@/hooks/useAuth';
import { useMyApplications } from '@/hooks/useApplications';
import { ApplyModal } from '@/components/jobs/ApplyModal';

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  'contract': 'Contract',
  'internship': 'Internship',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid Level',
  senior: 'Senior',
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);

  const [showModal, setShowModal] = useState(false);

  const { data: job, isLoading, isError } = useJob(jobId);
  const { data: meData } = useMe();
  const { data: myApps } = useMyApplications();

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
  const isDeveloper = meData?.role === 'developer';

  const alreadyApplied = myApps?.results?.some((app) => app.job.id === jobId) ?? false;

  /* ───── Loading ───── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-5xl px-4 py-12">
          <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="bg-white rounded-2xl p-8 space-y-4 border border-slate-100 shadow-sm animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-32 bg-slate-50 rounded w-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  /* ───── Error ───── */
  if (isError || !job) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6 py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
          <p className="text-slate-600 text-sm">This job listing may have been removed or does not exist.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm"
          >
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const salaryDisplay =
    job.salary_min && job.salary_max
      ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()} / yr`
      : 'Not disclosed';

  const postedDate = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const deadlineDate = job.deadline
    ? new Date(job.deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  /* ───── Page ───── */
  return (
    <div className="min-h-screen bg-slate-50/30 pb-16">
      {/* Minimal clean header */}
      <header className="border-b border-slate-100 bg-white py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-6">
            <button onClick={() => router.back()} className="hover:text-slate-800 transition-colors flex items-center">
              ← Back
            </button>
            <span className="opacity-40">/</span>
            <Link href="/jobs" className="hover:text-slate-800 transition-colors">Jobs</Link>
            <span className="opacity-40">/</span>
            <span className="text-slate-700 font-medium truncate max-w-[200px]">{job.title}</span>
          </nav>

          {/* Title block */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {job.is_remote && (
                  <span className="inline-flex items-center bg-emerald-50 border border-emerald-100/70 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded">
                    Remote
                  </span>
                )}
                <span className="inline-flex items-center bg-blue-50 border border-blue-100/70 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded">
                  {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                </span>
                <span className="inline-flex items-center bg-violet-50 border border-violet-100/70 text-violet-700 text-[11px] font-bold px-2 py-0.5 rounded">
                  {EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs md:text-sm text-slate-500 font-medium">
                <Link href={`/profile/${job.company.username}`} className="text-slate-850 font-bold hover:underline hover:text-slate-900 transition-colors">
                  {job.company.company_name}
                </Link>
                <span className="text-slate-300">•</span>
                <span>{job.location}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">Posted {postedDate}</span>
              </div>
            </div>

            {/* CTA on header */}
            <div className="md:pt-1">
              {alreadyApplied ? (
                <div className="inline-flex items-center bg-emerald-50 border border-emerald-100/70 text-emerald-700 text-xs font-bold px-5 py-2.5 rounded-lg">
                  ✓ Already Applied
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!isLoggedIn) { router.push('/login'); return; }
                    if (!isDeveloper) return;
                    setShowModal(true);
                  }}
                  className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:-translate-y-0.5 shadow-sm hover:shadow transition-all duration-200"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main body */}
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: description & details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description - Blue Theme */}
            <section className="bg-blue-50/20 border border-blue-100/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:bg-blue-50/40 hover:border-blue-200 transition-all duration-300">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                Job Description
              </h2>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {job.description}
              </div>
            </section>

            {/* Requirements - Emerald Theme */}
            <section className="bg-emerald-50/15 border border-emerald-100/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:bg-emerald-50/30 hover:border-emerald-200 transition-all duration-300">
              <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4">
                Requirements
              </h2>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {job.requirements}
              </div>
            </section>

            {/* Tech stack - Violet Theme */}
            <section className="bg-violet-50/15 border border-violet-100/45 rounded-2xl p-6 shadow-sm hover:shadow-md hover:bg-violet-50/35 hover:border-violet-200 transition-all duration-300">
              <h2 className="text-sm font-bold text-violet-900 uppercase tracking-wider mb-4">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="bg-white hover:bg-violet-600 text-violet-700 hover:text-white border border-violet-100/60 hover:border-violet-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 cursor-default shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-6">
            {/* Quick facts - Amber Theme */}
            <div className="bg-amber-50/15 border border-amber-100/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:bg-amber-50/35 hover:border-amber-200 transition-all duration-300 space-y-5">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Job Details</h3>

              <div className="space-y-3.5 text-xs md:text-sm">
                <div className="flex justify-between items-center gap-4 py-1.5 border-b border-amber-200/20 last:border-0">
                  <span className="text-[10px] text-amber-850/60 font-bold uppercase tracking-wider">Salary</span>
                  <span className="font-semibold text-slate-850 text-right">{salaryDisplay}</span>
                </div>

                <div className="flex justify-between items-center gap-4 py-1.5 border-b border-amber-200/20 last:border-0">
                  <span className="text-[10px] text-amber-850/60 font-bold uppercase tracking-wider">Type</span>
                  <span className="font-semibold text-slate-850 text-right">
                    {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4 py-1.5 border-b border-amber-200/20 last:border-0">
                  <span className="text-[10px] text-amber-850/60 font-bold uppercase tracking-wider">Location</span>
                  <span className="font-semibold text-slate-850 text-right">
                    {job.location}
                    {job.is_remote ? ' (Remote)' : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4 py-1.5 border-b border-amber-200/20 last:border-0">
                  <span className="text-[10px] text-amber-850/60 font-bold uppercase tracking-wider">Experience</span>
                  <span className="font-semibold text-slate-850 text-right">
                    {EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4 py-1.5 border-b border-amber-200/20 last:border-0">
                  <span className="text-[10px] text-amber-850/60 font-bold uppercase tracking-wider">Applicants</span>
                  <span className="font-semibold text-slate-850 text-right">{job.application_count} applied</span>
                </div>

                {deadlineDate && (
                  <div className="flex justify-between items-center gap-4 py-1.5 border-b border-amber-200/20 last:border-0">
                    <span className="text-[10px] text-amber-850/60 font-bold uppercase tracking-wider">Deadline</span>
                    <span className="font-semibold text-slate-850 text-right">{deadlineDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company card - Rose Theme */}
            <div className="bg-rose-50/15 border border-rose-100/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:bg-rose-50/35 hover:border-rose-200 transition-all duration-300">
              <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-4">About the Company</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                  {(job.company.company_name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    <Link href={`/profile/${job.company.username}`} className="hover:underline hover:text-slate-900 transition-colors">
                      {job.company.company_name}
                    </Link>
                  </p>
                  {job.company.company_size && (
                    <p className="text-xs text-slate-400 font-medium">{job.company.company_size} employees</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/profile/${job.company.username}`}
                  className="inline-flex items-center text-xs text-rose-700 hover:text-rose-900 font-bold tracking-wide transition-colors"
                >
                  View Public Profile →
                </Link>
                {job.company.company_website && (
                  <a
                    href={job.company.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium tracking-wide transition-colors"
                  >
                    Visit Website ↗
                  </a>
                )}
              </div>
            </div>

            {/* Apply CTA Card - Indigo Theme */}
            <div className="bg-indigo-50/15 border border-indigo-100/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:bg-indigo-50/35 hover:border-indigo-200 transition-all duration-300 text-center space-y-4">
              {alreadyApplied ? (
                <div className="space-y-2 py-1">
                  <p className="font-bold text-indigo-950 text-sm">✓ You've Applied</p>
                  <p className="text-indigo-800/60 text-xs mb-3">Track your status in your dashboard.</p>
                  <Link
                    href="/dashboard/developer"
                    className="block bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-xs font-semibold py-2.5 px-4 rounded-lg border border-indigo-100/60 transition-all duration-200"
                  >
                    View Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 py-1">
                  <p className="font-bold text-indigo-950 text-sm">Interested in this role?</p>
                  <p className="text-indigo-800/60 text-xs">Submit your application in minutes.</p>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { router.push('/login'); return; }
                      if (!isDeveloper) return;
                      setShowModal(true);
                    }}
                    className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 text-xs"
                  >
                    {isLoggedIn && !isDeveloper
                      ? 'Only developers can apply'
                      : isLoggedIn
                      ? 'Apply Now'
                      : 'Sign in to Apply'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Application Modal */}
      {showModal && <ApplyModal job={job} onClose={() => setShowModal(false)} />}
    </div>
  );
}