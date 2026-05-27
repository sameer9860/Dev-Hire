'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApply } from '@/hooks/useApplications';
import type { Job } from '@/types/api';
import { X, Send, FileText, Link2, CheckCircle2, AlertCircle } from 'lucide-react';

const applySchema = z.object({
  cover_letter: z
    .string()
    .min(50, 'Cover letter must be at least 50 characters')
    .max(2000, 'Cover letter must not exceed 2000 characters'),
  resume_url: z
    .string()
    .url('Please enter a valid URL (e.g. https://drive.google.com/...)')
    .min(1, 'Resume URL is required'),
});

type ApplyFormData = z.infer<typeof applySchema>;

interface ApplyModalProps {
  job: Job;
  onClose: () => void;
}

export function ApplyModal({ job, onClose }: ApplyModalProps) {
  const apply = useApply();
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: { cover_letter: '', resume_url: '' },
  });

  const coverLetterValue = watch('cover_letter');

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const onSubmit = (data: ApplyFormData) => {
    apply.mutate(
      { job: job.id, cover_letter: data.cover_letter, resume_url: data.resume_url },
      { onSuccess: () => { setTimeout(onClose, 1800); } }
    );
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
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
              been submitted. Good luck! 🎉
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

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Cover Letter
                </span>
              </label>
              <textarea
                {...register('cover_letter')}
                rows={8}
                placeholder="Tell the hiring team why you're the perfect fit. Mention your relevant experience, key projects, and what excites you about this role..."
                className={`w-full border rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 transition ${
                  errors.cover_letter
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-blue-500/30 focus:border-blue-400'
                }`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.cover_letter ? (
                  <p className="text-xs text-red-500">{errors.cover_letter.message}</p>
                ) : (
                  <p className="text-xs text-slate-400">Minimum 50 characters</p>
                )}
                <span className={`text-xs tabular-nums ${
                  (coverLetterValue?.length ?? 0) > 1800 ? 'text-red-500' : 'text-slate-400'
                }`}>
                  {coverLetterValue?.length ?? 0} / 2000
                </span>
              </div>
            </div>

            {/* Resume URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-slate-400" />
                  Resume / Portfolio URL
                </span>
              </label>
              <input
                {...register('resume_url')}
                type="url"
                placeholder="https://drive.google.com/your-resume or https://yourportfolio.dev"
                className={`w-full border rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                  errors.resume_url
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-blue-500/30 focus:border-blue-400'
                }`}
              />
              {errors.resume_url && (
                <p className="text-xs text-red-500 mt-1.5">{errors.resume_url.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || apply.isPending}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
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
