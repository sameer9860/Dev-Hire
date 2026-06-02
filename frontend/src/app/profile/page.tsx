'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import {
  developerProfileSchema,
  companyProfileSchema,
  type DeveloperProfileFormData,
  type CompanyProfileFormData,
} from '@/schemas/profileSchema';
import { TagInput } from '@/components/jobs/TagInput';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { User, Globe, GitBranch, Link as LinkIcon, FileText, ArrowLeft, Building } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMe();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [successMessage, setSuccessMessage] = useState('');

  // Route protection
  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <Link
            href={`/profile/${user.username}`}
            className="text-sm font-medium text-zinc-900 hover:underline"
          >
            View Public Profile
          </Link>
        </div>

        {/* Card Header & Form Container */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-100 mb-8">
            <div className="w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center text-2xl text-white font-bold shadow-md">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              {!profile.avatar_url ? profile.username.substring(0, 2).toUpperCase() : null}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-zinc-900">{profile.username}</h1>
              <p className="text-sm text-zinc-500 capitalize">{profile.role} account</p>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium animate-in fade-in duration-200">
              {successMessage}
            </div>
          )}

          {updateProfile.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {updateProfile.error.message || 'An error occurred while saving your profile.'}
            </div>
          )}

          {profile.role === 'company' ? (
            <CompanyProfileForm
              profile={profile}
              onSubmit={(data) => {
                updateProfile.mutate(data, {
                  onSuccess: () => {
                    setSuccessMessage('Company profile updated successfully! Redirecting...');
                    setTimeout(() => {
                      setSuccessMessage('');
                      router.push(`/profile/${profile.username}`);
                    }, 1500);
                  },
                });
              }}
              isSaving={updateProfile.isPending}
            />
          ) : (
            <DeveloperProfileForm
              profile={profile}
              onSubmit={(data) => {
                updateProfile.mutate(data, {
                  onSuccess: () => {
                    setSuccessMessage('Developer profile updated successfully! Redirecting...');
                    setTimeout(() => {
                      setSuccessMessage('');
                      router.push(`/profile/${profile.username}`);
                    }, 1500);
                  },
                });
              }}
              isSaving={updateProfile.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   DEVELOPER PROFILE FORM
   ────────────────────────────────────────────────────────────────── */
interface DeveloperFormProps {
  profile: any;
  onSubmit: (data: DeveloperProfileFormData) => void;
  isSaving: boolean;
}

function DeveloperProfileForm({ profile, onSubmit, isSaving }: DeveloperFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeveloperProfileFormData>({
    resolver: zodResolver(developerProfileSchema),
    defaultValues: {
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
      skills: profile.skills || [],
      github_url: profile.github_url || '',
      portfolio_url: profile.portfolio_url || '',
      resume_url: profile.resume_url || '',
    },
  });

  const skillsValue = watch('skills');
  const avatarUrlWatch = watch('avatar_url');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar URL */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Avatar Image URL</label>
        <div className="flex gap-4 items-center">
          <input
            {...register('avatar_url')}
            type="text"
            placeholder="https://example.com/avatar.jpg"
            className="flex-1 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
          {avatarUrlWatch && (avatarUrlWatch.startsWith('http://') || avatarUrlWatch.startsWith('https://') || avatarUrlWatch.startsWith('/') || avatarUrlWatch.startsWith('data:')) && (
            <div className="w-10 h-10 rounded-full border bg-zinc-150 overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlWatch} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {errors.avatar_url && <p className="text-red-500 text-xs mt-1.5">{errors.avatar_url.message}</p>}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Bio</label>
        <textarea
          {...register('bio')}
          placeholder="Tell developers or companies about yourself, your background, and your goals..."
          rows={4}
          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
        />
        {errors.bio && <p className="text-red-500 text-xs mt-1.5">{errors.bio.message}</p>}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Skills / Tech Stack</label>
        <TagInput
          value={skillsValue}
          onChange={(tags) => setValue('skills', tags)}
          placeholder="Add tools, languages, and frameworks (e.g. React, Docker, Python)..."
          error={errors.skills?.message}
        />
      </div>

      {/* Links (GitHub, Portfolio, Resume) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-zinc-600" />
              GitHub URL
            </span>
          </label>
          <input
            {...register('github_url')}
            type="text"
            placeholder="https://github.com/your-username"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
          {errors.github_url && <p className="text-red-500 text-xs mt-1.5">{errors.github_url.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-zinc-600" />
              Portfolio URL
            </span>
          </label>
          <input
            {...register('portfolio_url')}
            type="text"
            placeholder="https://yourportfolio.dev"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
          {errors.portfolio_url && <p className="text-red-500 text-xs mt-1.5">{errors.portfolio_url.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-zinc-600" />
              Resume URL
            </span>
          </label>
          <input
            {...register('resume_url')}
            type="text"
            placeholder="https://example.com/my-resume.pdf"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
          {errors.resume_url && <p className="text-red-500 text-xs mt-1.5">{errors.resume_url.message}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────────────
   COMPANY PROFILE FORM
   ────────────────────────────────────────────────────────────────── */
interface CompanyFormProps {
  profile: any;
  onSubmit: (data: CompanyProfileFormData) => void;
  isSaving: boolean;
}

function CompanyProfileForm({ profile, onSubmit, isSaving }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
      company_name: profile.company_name || '',
      company_website: profile.company_website || '',
      company_size: profile.company_size || '',
    },
  });

  const avatarUrlWatch = watch('avatar_url');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar / Logo URL */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Company Logo URL</label>
        <div className="flex gap-4 items-center">
          <input
            {...register('avatar_url')}
            type="text"
            placeholder="https://example.com/logo.png"
            className="flex-1 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
          {avatarUrlWatch && (avatarUrlWatch.startsWith('http://') || avatarUrlWatch.startsWith('https://') || avatarUrlWatch.startsWith('/') || avatarUrlWatch.startsWith('data:')) && (
            <div className="w-10 h-10 rounded-full border bg-zinc-150 overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlWatch} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {errors.avatar_url && <p className="text-red-500 text-xs mt-1.5">{errors.avatar_url.message}</p>}
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Company Name *</label>
        <input
          {...register('company_name')}
          type="text"
          placeholder="e.g. Acme Corp"
          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
        />
        {errors.company_name && <p className="text-red-500 text-xs mt-1.5">{errors.company_name.message}</p>}
      </div>

      {/* Bio / About */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">About Company</label>
        <textarea
          {...register('bio')}
          placeholder="Describe your company, culture, values, and why talent should join your team..."
          rows={4}
          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
        />
        {errors.bio && <p className="text-red-500 text-xs mt-1.5">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Website */}
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-zinc-600" />
              Company Website
            </span>
          </label>
          <input
            {...register('company_website')}
            type="text"
            placeholder="https://acme.co"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
          {errors.company_website && <p className="text-red-500 text-xs mt-1.5">{errors.company_website.message}</p>}
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-zinc-600" />
              Company Size
            </span>
          </label>
          <select
            {...register('company_size')}
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50"
          >
            <option value="">Select size...</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="500+">500+ employees</option>
          </select>
          {errors.company_size && <p className="text-red-500 text-xs mt-1.5">{errors.company_size.message}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
