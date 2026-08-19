'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApply } from '@/hooks/useApplications';
import { useMe } from '@/hooks/useAuth';
import type { Job } from '@/types/api';
import { X, Send, FileText, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-y-auto my-auto animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Apply for this role</h2>
            <p className="text-sm text-slate-500 mt-0.5">
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

        {/* Success State */}
        {apply.isSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Application Sent!</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              Your application for <span className="font-medium text-slate-700">{job.title}</span> has
              been submitted. Good luck!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

            {/* API Error */}
            {apply.isError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Failed to submit application</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    {apply.error?.message ?? 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>
              </div>
            )}

            {/* Top Banner Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Your Resume</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Whenever you apply to an internship or fresher job, the employer will see the resume from your profile. Always make sure it is up to date.
                </p>
              </div>
              <Link
                href="/profile"
                target="_blank"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs flex-shrink-0 transition"
              >
                Update Profile
              </Link>
            </div>

            {/* Applicant Profile Summary Card */}
            {user && (
              <div className="border border-slate-200/80 rounded-2xl p-4 bg-gradient-to-br from-slate-50 to-blue-50/20 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      {user.username}
                    </h3>
                    {user.headline && <p className="text-xs font-medium text-slate-700 mt-0.5">{user.headline}</p>}
                    {user.location && <p className="text-[11px] text-slate-500">{user.location}</p>}
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[10px] uppercase">
                    Applicant Profile
                  </span>
                </div>
                {user.bio && (
                  <p className="text-slate-600 line-clamp-2 italic pt-1 border-t border-slate-200/60">
                    &quot;{user.bio}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Cover Letter (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Cover Letter <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </span>
                </span>
              </label>
              <textarea
                {...register('cover_letter')}
                rows={4}
                placeholder="Optionally add notes or a cover letter for the hiring team..."
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
              <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                <span>Optional</span>
                <span>{coverLetterValue.length} / 2000</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || apply.isPending}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer"
              >
                {apply.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
