'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { jobSchema, type JobFormData } from '@/schemas/jobSchema';
import { useCreateJob } from '@/hooks/useJobs';
import { useMe } from '@/hooks/useAuth';
import { TagInput } from '@/components/jobs/TagInput';

export default function PostJobPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMe();
  const createJob = useCreateJob();

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
          <p className="text-gray-600 mb-8">Fill out the form below to post a job listing for your company.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Job Title *</label>
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