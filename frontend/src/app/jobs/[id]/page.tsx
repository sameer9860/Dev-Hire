'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useJob } from '@/hooks/useJobs';
import { useMe } from '@/hooks/useAuth';
import { useMyApplications } from '@/hooks/useApplications';
import { ApplyModal } from '@/components/jobs/ApplyModal';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Users,
  Globe,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  Building2,
  Code2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-xl w-40" />
            <div className="bg-white rounded-2xl p-8 space-y-5 shadow-sm border border-slate-100">
              <div className="h-8 bg-slate-200 rounded-xl w-2/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded-full w-24" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 space-y-4 shadow-sm border border-slate-100">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded-lg" style={{ width: `${70 + (i % 3) * 10}%` }} />
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───── Error ───── */
  if (isError || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Briefcase className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Job Not Found</h2>
          <p className="text-slate-500 text-sm">
            This listing may have been removed or the link might be incorrect.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
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
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Hero header */}
      <header className="relative overflow-hidden bg-slate-950 pt-10 pb-14 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_40%)]" />

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-slate-400 text-sm mb-8">
            <button onClick={() => router.back()} className="hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            <Link href="/jobs" className="hover:text-white transition">Jobs</Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            <span className="text-slate-300 truncate max-w-[200px]">{job.title}</span>
          </nav>

          {/* Title block */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {job.is_remote && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full">
                    <Globe className="h-3 w-3" />
                    Remote
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium px-3 py-1 rounded-full">
                  <Briefcase className="h-3 w-3" />
                  {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                </span>
                <span className="inline-flex items-center gap-1 bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-medium px-3 py-1 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  {EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {job.company.company_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Posted {postedDate}
                </span>
              </div>
            </div>

            {/* CTA on header */}
            <div className="md:pt-2">
              {alreadyApplied ? (
                <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold px-5 py-3 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  Already Applied
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!isLoggedIn) { router.push('/login'); return; }
                    if (!isDeveloper) return;
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
                >
                  Apply Now →
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main body */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: description */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-7 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" />
                Job Description
              </h2>
              <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </section>

            {/* Requirements */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-7 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                Requirements
              </h2>
              <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {job.requirements}
              </div>
            </section>

            {/* Tech stack */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-7 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-500" />
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium px-3 py-1.5 rounded-lg"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">

            {/* Quick facts */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Job Details</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Salary</p>
                    <p className="font-semibold text-slate-800">{salaryDisplay}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Type</p>
                    <p className="font-semibold text-slate-800">{JOB_TYPE_LABELS[job.job_type]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Location</p>
                    <p className="font-semibold text-slate-800">{job.location}{job.is_remote ? ' (Remote OK)' : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Experience</p>
                    <p className="font-semibold text-slate-800">{EXPERIENCE_LABELS[job.experience_level]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Applicants</p>
                    <p className="font-semibold text-slate-800">{job.application_count} applied</p>
                  </div>
                </div>

                {deadlineDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Deadline</p>
                      <p className="font-semibold text-slate-800">{deadlineDate}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">About the Company</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {(job.company.company_name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{job.company.company_name}</p>
                  {job.company.company_size && (
                    <p className="text-xs text-slate-400">{job.company.company_size} employees</p>
                  )}
                </div>
              </div>
              {job.company.company_website && (
                <a
                  href={job.company.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit Website
                </a>
              )}
            </div>

            {/* Apply CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
              {alreadyApplied ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto" />
                  <p className="font-bold text-lg">You've Applied!</p>
                  <p className="text-blue-200 text-sm">Track your status in your dashboard.</p>
                  <Link
                    href="/dashboard/developer"
                    className="block mt-3 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium py-2.5 px-4 rounded-xl text-center transition"
                  >
                    View Dashboard
                  </Link>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="font-bold text-lg">Interested in this role?</p>
                  <p className="text-blue-200 text-sm">Submit your application in minutes.</p>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { router.push('/login'); return; }
                      if (!isDeveloper) return;
                      setShowModal(true);
                    }}
                    className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold py-3 rounded-xl transition mt-1 text-sm"
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