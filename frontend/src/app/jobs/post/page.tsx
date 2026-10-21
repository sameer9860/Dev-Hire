'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { jobSchema, type JobFormData } from '@/schemas/jobSchema';
import { useCreateJob, useGenerateJobPost, useAuditJobDraft } from '@/hooks/useJobs';
import { useMe } from '@/hooks/useAuth';
import { TagInput } from '@/components/jobs/TagInput';
import { Sparkles, Loader2, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { JobAuditResult } from '@/types/api';
import { useState } from 'react';

export default function PostJobPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMe();
  const createJob = useCreateJob();
  const generatePostMutation = useGenerateJobPost();
  const auditMutation = useAuditJobDraft();
  const [auditResult, setAuditResult] = useState<JobAuditResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      location: '',
      is_remote: false,
      job_type: 'full-time',
      experience_level: 'mid',
      tech_stack: [],
      salary_min: null,
      salary_max: null,
      deadline: '',
    },
  });

  const techStack = watch('tech_stack');
  const descriptionValue = watch('description');
  const requirementsValue = watch('requirements');

  const handleRunAudit = () => {
    const title = watch('title')?.trim();
    if (!title) {
      toast.info('Please enter a Job Title before running quality check.');
      return;
    }
    auditMutation.mutate(
      {
        title,
        description: watch('description'),
        requirements: watch('requirements'),
        tech_stack: watch('tech_stack'),
        salary_min: watch('salary_min'),
        salary_max: watch('salary_max'),
        location: watch('location'),
      },
      {
        onSuccess: (data) => {
          setAuditResult(data);
          if (data.quality_score >= 80) {
            toast.success(`Listing Quality: ${data.quality_score}/100 — Strong listing! 🌟`);
          } else if (data.quality_score >= 60) {
            toast.info(`Listing Quality: ${data.quality_score}/100 — Good with suggestions.`);
          } else {
            toast.warning(`Listing Quality: ${data.quality_score}/100 — Needs improvement.`);
          }
        },
      }
    );
  };

  const handleGenerateJobPost = () => {
    const title = watch('title')?.trim();
    if (!title) {
      toast.info('Please enter a Job Title first (e.g., "Senior React Developer") to auto-generate!');
      return;
    }

    generatePostMutation.mutate(
      {
        title,
        experience_level: watch('experience_level'),
        job_type: watch('job_type'),
        location: watch('location'),
      },
      {
        onSuccess: (data) => {
          setValue('description', data.description, { shouldDirty: true, shouldValidate: true });
          setValue('requirements', data.requirements, { shouldDirty: true, shouldValidate: true });
          if (data.tech_stack && data.tech_stack.length > 0) {
            setValue('tech_stack', data.tech_stack, { shouldDirty: true });
          }
          toast.success(
            data.ai_enhanced
              ? 'Job description & tech stack auto-generated with Gemini AI! ✨'
              : 'Job description & tech stack generated from template! ✨'
          );
        },
      }
    );
  };

  // Route protection - only run on client side
  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user && user.role !== 'company') {
      router.push('/jobs');
    }
  }, [user, router]);

  const onSubmit = (data: JobFormData) => {
    createJob.mutate(data, {
      onSuccess: (job) => {
        router.push(`/jobs/${job.id}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
          <h1 className="text-3xl font-bold mb-2">Post a New Job</h1>
          <p className="text-gray-600 mb-6">Fill out the form below to post a job listing for your company.</p>

          {/* AI Assistant Banner */}
          <div className="mb-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-blue-50/50 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    AI Job Post Assistant
                    <span className="rounded-full bg-indigo-100 px-2 py-0.2 text-[10px] font-semibold text-indigo-700">
                      Smart Auto-Fill
                    </span>
                  </h3>
                  <p className="text-[12px] text-zinc-600 mt-0.5">
                    Enter a job title below, then click to auto-generate description, responsibilities, and recommended skills.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateJobPost}
                disabled={generatePostMutation.isPending}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                {generatePostMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-fill with AI ✨</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-900">Job Title *</label>
                <button
                  type="button"
                  onClick={handleGenerateJobPost}
                  disabled={generatePostMutation.isPending}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate Post ✨
                </button>
              </div>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g., Senior React Developer"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Job Description *</label>
              <textarea
                {...register('description')}
                placeholder="Describe the role, responsibilities, and what makes this position unique..."
                rows={5}
                className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                ) : (
                  <p className="text-xs text-gray-500">Minimum 50 characters</p>
                )}
                <span className={`text-xs tabular-nums ${
                  (descriptionValue?.length ?? 0) >= 50 ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {descriptionValue?.length ?? 0} / 5000
                </span>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Requirements *</label>
              <textarea
                {...register('requirements')}
                placeholder="List the must-have skills and experience needed for this role..."
                rows={4}
                className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.requirements ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.requirements ? (
                  <p className="text-xs text-red-500">{errors.requirements.message}</p>
                ) : (
                  <p className="text-xs text-gray-500">Minimum 50 characters</p>
                )}
                <span className={`text-xs tabular-nums ${
                  (requirementsValue?.length ?? 0) >= 50 ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {requirementsValue?.length ?? 0} / 5000
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Location *</label>
                <input
                  {...register('location')}
                  type="text"
                  placeholder="e.g., San Francisco, CA"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Job Type *</label>
                <select
                  {...register('job_type')}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                {errors.job_type && <p className="text-red-500 text-xs mt-1">{errors.job_type.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Experience Level *</label>
                <select
                  {...register('experience_level')}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
                {errors.experience_level && <p className="text-red-500 text-xs mt-1">{errors.experience_level.message}</p>}
              </div>

              {/* Remote */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-7">
                  <input type="checkbox" {...register('is_remote')} className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium text-gray-900">Remote Position</span>
                </label>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Technologies Required *</label>
              <TagInput
                value={techStack}
                onChange={(tags) => setValue('tech_stack', tags)}
                placeholder="Type a technology and press Enter..."
                error={errors.tech_stack?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Salary Min */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Minimum Salary</label>
                <input
                  {...register('salary_min', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                  type="number"
                  placeholder="e.g., 80000"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.salary_min && <p className="text-red-500 text-xs mt-1">{errors.salary_min.message}</p>}
              </div>

              {/* Salary Max */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Maximum Salary</label>
                <input
                  {...register('salary_max', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                  type="number"
                  placeholder="e.g., 120000"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.salary_max && <p className="text-red-500 text-xs mt-1">{errors.salary_max.message}</p>}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Application Deadline *</label>
              <input
                {...register('deadline')}
                type="date"
                className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.deadline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
            </div>

            {/* AI Listing Quality & Safety Pre-Audit Section */}
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-indigo-50/30 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      AI Job Quality & Trust Check
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Listing Assistant
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Detects missing responsibilities, evaluates clarity, and scans for scam/duplicate flags.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={auditMutation.isPending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {auditMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing Listing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Analyze Listing Quality
                    </>
                  )}
                </button>
              </div>

              {auditResult && (
                <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3.5">
                  {/* Score & Moderation Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 border border-zinc-100 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold text-white ${
                          auditResult.quality_score >= 80
                            ? 'bg-emerald-600'
                            : auditResult.quality_score >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      >
                        {auditResult.quality_score}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">
                          Listing Quality Score: {auditResult.quality_score}/100
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {auditResult.quality_score >= 80
                            ? 'High quality · Ready to attract top developers'
                            : auditResult.quality_score >= 60
                            ? 'Moderate quality · Consider adding missing details'
                            : 'Low quality · Requires more description and responsibilities'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        auditResult.moderation_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {auditResult.moderation_status === 'approved' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Approved for Instant Publish
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          Flagged for Review
                        </>
                      )}
                    </span>
                  </div>

                  {/* Safety Flags Warning */}
                  {auditResult.safety_flags && auditResult.safety_flags.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        Warning Signs Detected:
                      </p>
                      {auditResult.safety_flags.map((flag, idx) => (
                        <p key={idx} className="pl-5 text-amber-800 text-[11px]">
                          • <span className="font-semibold capitalize">{flag.type.replace('_', ' ')}:</span> {flag.message}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Missing Elements */}
                  {auditResult.missing_elements && auditResult.missing_elements.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                        Missing or Incomplete Items
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {auditResult.missing_elements.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-100"
                          >
                            ✕ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {auditResult.suggestions && auditResult.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Recommendations for Better Candidate Reach
                      </p>
                      <ul className="space-y-1 text-xs text-zinc-600">
                        {auditResult.suggestions.map((sug, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold shrink-0">→</span>
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {createJob.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">
                  {createJob.error.message || 'Failed to post job. Please try again.'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || createJob.isPending}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || createJob.isPending ? 'Posting Job...' : 'Post Job'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 bg-gray-200 text-gray-900 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}