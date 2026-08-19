'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApply } from '@/hooks/useApplications';
import { useMe } from '@/hooks/useAuth';
import type { Job, User, SocialLink } from '@/types/api';
import {
  X,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Link as LinkIcon,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import { socialPlatformLabel } from '@/lib/profileOptions';

const applySchema = z.object({
  cover_letter: z
    .string()
    .max(2000, 'Cover letter must not exceed 2000 characters')
    .optional(),
});

type ApplyFormData = z.infer<typeof applySchema>;

interface ApplyModalProps {
  job: Job;
  onClose: () => void;
}

/* ── tiny helpers ──────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {label}
    </span>
  );
}

function ProfileSnapshot({ user }: { user: User }) {
  const displayName =
    user.first_name || user.last_name
      ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
      : user.username;

  const socialLinks: SocialLink[] =
    user.social_links && user.social_links.length > 0
      ? user.social_links.filter((l) => l.url)
      : ([
          user.github_url ? { platform: 'github', url: user.github_url } : null,
          user.portfolio_url ? { platform: 'portfolio', url: user.portfolio_url } : null,
        ].filter(Boolean) as SocialLink[]);

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xl font-bold text-white shadow">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            displayName.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{displayName}</p>
          {user.headline && (
            <p className="truncate text-xs font-semibold text-blue-600">{user.headline}</p>
          )}
          {user.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {user.location}
            </p>
          )}
        </div>
        <Link
          href="/profile"
          target="_blank"
          className="ml-auto flex-shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100"
        >
          Update Profile
        </Link>
      </div>

      {/* About */}
      {user.bio && (
        <Section title="About">
          <p className="text-xs leading-relaxed text-slate-600">{user.bio}</p>
        </Section>
      )}

      {/* Contact */}
      <Section title="Contact">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {user.email && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          {user.phone_number && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <span>{user.phone_number}</span>
            </div>
          )}
        </div>
      </Section>

      {/* Education */}
      {user.education && user.education.length > 0 && (
        <Section title="Education">
          <div className="space-y-2">
            {user.education.map((edu, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                {edu.dates && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {edu.dates}
                  </p>
                )}
                <p className="text-xs font-bold text-slate-900">{edu.degree}</p>
                <p className="text-xs text-slate-600">
                  {edu.institution}
                  {edu.location ? `, ${edu.location}` : ''}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {user.experience && user.experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-2">
            {user.experience.map((exp, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{exp.position}</p>
                    <p className="text-xs text-slate-600">{exp.company}</p>
                  </div>
                  {exp.dates && (
                    <span className="flex-shrink-0 text-[10px] text-slate-500">{exp.dates}</span>
                  )}
                </div>
                {exp.description && (
                  <p className="mt-1 text-xs text-slate-500">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {user.projects && user.projects.length > 0 && (
        <Section title="Projects">
          <div className="space-y-2">
            {user.projects.map((proj, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">{proj.title}</p>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
                {proj.date && (
                  <p className="text-[10px] text-slate-400">{proj.date}</p>
                )}
                {proj.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((s) => (
              <Tag key={s} label={s} />
            ))}
          </div>
        </Section>
      )}

      {/* Achievements */}
      {user.achievements && user.achievements.length > 0 && (
        <Section title="Achievements">
          <ul className="list-inside list-disc space-y-0.5 text-xs text-slate-700">
            {user.achievements.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Training */}
      {user.training && user.training.length > 0 && (
        <Section title="Training">
          <div className="space-y-1">
            {user.training.map((tr, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                <span className="font-semibold text-slate-800">{tr.title}</span>
                {tr.date && <span className="text-slate-400">{tr.date}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {user.languages && user.languages.length > 0 && (
        <Section title="Languages">
          <div className="flex flex-wrap gap-1.5">
            {user.languages.map((lang) => (
              <Tag key={lang} label={lang} />
            ))}
          </div>
        </Section>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <Section title="Links">
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {link.platform === 'github' ? (
                  <GitBranch className="h-3.5 w-3.5 text-slate-700" />
                ) : (
                  <LinkIcon className="h-3.5 w-3.5 text-slate-500" />
                )}
                {socialPlatformLabel(link.platform)}
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Resume preview */}
      {user.resume_url && (
        <Section title="Resume">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-600">Resume / CV</span>
              <a
                href={user.resume_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-bold text-blue-600 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Open full window
              </a>
            </div>
            <div className="h-80 w-full bg-slate-900">
              <iframe src={user.resume_url} className="h-full w-full border-0" title="Resume Viewer" />
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ── main modal ────────────────────────────────────────────────── */

export function ApplyModal({ job, onClose }: ApplyModalProps) {
  const apply = useApply();
  const { data: user } = useMe();
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: { cover_letter: '' },
  });

  const coverLetterValue = watch('cover_letter') || '';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const onSubmit = (data: ApplyFormData) => {
    apply.mutate(
      { job: job.id, cover_letter: data.cover_letter || '' },
      { onSuccess: () => { setTimeout(onClose, 1800); } }
    );
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div className="relative my-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Apply for this role</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{job.title}</span>
              {' · '}
              {job.company.company_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success */}
        {apply.isSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">Application Sent!</h3>
            <p className="max-w-sm text-sm text-slate-500">
              Your application for{' '}
              <span className="font-medium text-slate-700">{job.title}</span> has been submitted.
              Good luck!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
              {/* Resume notice banner */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-amber-800">
                  Whenever you apply to an internship or fresher job, the employer will see
                  the resume from your profile. Always make sure it is up to date.
                </p>
              </div>

              {/* API error */}
              {apply.isError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Failed to submit application</p>
                    <p className="mt-0.5 text-xs text-red-500">
                      {apply.error?.message ?? 'An unexpected error occurred. Please try again.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Full profile snapshot */}
              {user && <ProfileSnapshot user={user} />}

              {/* Cover letter */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Cover Letter
                  <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  {...register('cover_letter')}
                  rows={4}
                  placeholder="Optionally add notes or a cover letter for the hiring team..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
                {errors.cover_letter && (
                  <p className="mt-1 text-xs text-red-500">{errors.cover_letter.message}</p>
                )}
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>Optional</span>
                  <span>{coverLetterValue.length} / 2000</span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-3 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || apply.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60 cursor-pointer"
              >
                {apply.isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
