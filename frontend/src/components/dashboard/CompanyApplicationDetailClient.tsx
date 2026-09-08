'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileDown,
  ExternalLink,
  GitBranch,
  Globe,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  UserCheck,
  Building,
  Sparkles,
} from 'lucide-react';
import { useApplication, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { UserAvatar } from '@/components/UserAvatar';
import type { ApplicationStatus } from '@/types/api';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { value: 'accepted', label: 'Interviewed / Accepted', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-800 border-red-200' },
];

export function CompanyApplicationDetailClient({ id }: { id: number }) {
  const router = useRouter();
  const { data: application, isLoading, error } = useApplication(id);
  const updateStatusMutation = useUpdateApplicationStatus();

  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (application) {
      setNotes(application.notes || '');
    }
  }, [application]);

  const handleStatusUpdate = (newStatus: ApplicationStatus) => {
    if (!application) return;
    updateStatusMutation.mutate({
      id: application.id,
      status: newStatus,
      notes,
    });
  };

  const handleSaveNotes = () => {
    if (!application) return;
    updateStatusMutation.mutate(
      {
        id: application.id,
        status: application.status,
        notes,
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
          <p className="text-sm font-medium text-zinc-500">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-950">Application Not Found</h2>
            <p className="mt-1 text-sm text-red-700">
              {(error as Error)?.message || 'The requested candidate application could not be loaded.'}
            </p>
            <Link
              href="/dashboard/company/applications"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dev = application.developer;
  const job = application.job;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard/company/applications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <UserAvatar src={dev?.avatar_url} name={dev?.username || 'Candidate'} size="lg" className="h-20 w-20 text-xl" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {dev?.first_name && dev?.last_name ? `${dev.first_name} ${dev.last_name}` : dev?.username}
                </h1>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                  Candidate
                </span>
              </div>

              {dev?.headline && <p className="mt-1 text-sm font-medium text-zinc-600">{dev.headline}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                {dev?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    <a href={`mailto:${dev.email}`} className="hover:text-zinc-900 underline">
                      {dev.email}
                    </a>
                  </div>
                )}
                {dev?.phone_number && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{dev.phone_number}</span>
                  </div>
                )}
                {(dev?.location || dev?.city) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{dev.location || `${dev.city}, ${dev.province || ''}`}</span>
                  </div>
                )}
              </div>

              {/* External Links & Resume */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {application.resume_url && (
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Download Resume PDF
                  </a>
                )}
                {dev?.github_url && (
                  <a
                    href={dev.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
                    GitHub
                  </a>
                )}
                {dev?.portfolio_url && (
                  <a
                    href={dev.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    <Globe className="h-3.5 w-3.5 text-zinc-500" />
                    Portfolio
                  </a>
                )}
                <Link
                  href={`/profile/${dev?.username}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                  Public Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Job & Pipeline Status Banner */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Target Role</p>
            <h2 className="mt-1 text-xl font-bold text-zinc-900">{job.title}</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Applied on {formatDate(application.applied_at)} · Location:{' '}
              <span className="font-medium text-zinc-700">{job.is_remote ? 'Remote' : job.location}</span>
            </p>
          </div>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 underline"
          >
            View Job Details
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Status Pipeline Selector */}
        <div className="mt-6">
          <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-500">
            Pipeline Stage / Application Status
          </label>
          <div className="flex flex-wrap gap-2.5">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = application.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusUpdate(opt.value)}
                  disabled={updateStatusMutation.isPending}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? `${opt.color} ring-2 ring-zinc-900 ring-offset-1 shadow-sm`
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSelected ? 'bg-zinc-950' : 'bg-zinc-300'
                    }`}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Cover Letter & Recruiter Notes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cover Letter */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900">Cover Letter / Note</h3>
          <p className="mt-1 text-xs text-zinc-500">Submitted by candidate during application</p>
          <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap min-h-[120px]">
            {application.cover_letter || 'No cover letter submitted.'}
          </div>
        </div>

        {/* Recruiter Notes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900">Recruiter Notes</h3>
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Notes Saved
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Private internal notes for candidate evaluation</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add interview feedback, evaluation scores, or notes..."
            rows={4}
            className="mt-4 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={updateStatusMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              <Save className="h-3.5 w-3.5" />
              Save Notes
            </button>
          </div>
        </div>
      </div>

      {/* Full Developer Profile Details */}
      <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">
          Candidate Profile Overview
        </h3>

        {/* Skills */}
        {dev?.skills && dev.skills.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Technical Skills</h4>
            <div className="flex flex-wrap gap-2">
              {dev.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {dev?.bio && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">About / Bio</h4>
            <p className="text-xs leading-relaxed text-zinc-700">{dev.bio}</p>
          </div>
        )}

        {/* Experience */}
        {dev?.experience && dev.experience.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-zinc-400" /> Work Experience
            </h4>
            <div className="space-y-3">
              {dev.experience.map((exp, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 text-xs">
                  <p className="font-semibold text-zinc-900">{exp.position}</p>
                  <p className="text-zinc-600">{exp.company} · {exp.dates}</p>
                  {exp.description && <p className="mt-2 text-zinc-600">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {dev?.education && dev.education.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-zinc-400" /> Education
            </h4>
            <div className="space-y-3">
              {dev.education.map((edu, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 text-xs">
                  <p className="font-semibold text-zinc-900">{edu.degree}</p>
                  <p className="text-zinc-600">{edu.institution} · {edu.dates}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {dev?.projects && dev.projects.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
              <FolderGit2 className="h-4 w-4 text-zinc-400" /> Key Projects
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dev.projects.map((proj, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 text-xs">
                  <p className="font-semibold text-zinc-900">{proj.title}</p>
                  {proj.description && <p className="mt-1 text-zinc-600">{proj.description}</p>}
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-medium text-zinc-900 underline"
                    >
                      View Project <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
