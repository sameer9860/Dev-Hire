'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import api from '@/lib/api';
import {
  developerProfileSchema,
  companyProfileSchema,
  type DeveloperProfileFormData,
  type CompanyProfileFormData,
} from '@/schemas/profileSchema';
import { TagInput } from '@/components/jobs/TagInput';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { ArrowLeft, Globe, Building } from 'lucide-react';
import Link from 'next/link';
import {
  GENDER_OPTIONS,
  NEPAL_PROVINCES,
  SOCIAL_PLATFORMS,
} from '@/lib/profileOptions';
import type { SocialLink } from '@/types/api';

function seedSocialLinks(profile: {
  social_links?: SocialLink[];
  github_url?: string;
  portfolio_url?: string;
}): SocialLink[] {
  if (profile.social_links && profile.social_links.length > 0) {
    return profile.social_links;
  }
  const seeded: SocialLink[] = [];
  if (profile.github_url) seeded.push({ platform: 'github', url: profile.github_url });
  if (profile.portfolio_url) seeded.push({ platform: 'portfolio', url: profile.portfolio_url });
  return seeded;
}

const PROFILE_SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills & Tech Stack' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'training', label: 'Training' },
  { id: 'languages', label: 'Languages' },
  { id: 'contact', label: 'Email & Phone' },
];

function ProfileSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8"
    >
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

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

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-950 text-2xl font-bold text-white shadow-md">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-full w-full rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                {!profile.avatar_url ? profile.username.substring(0, 2).toUpperCase() : null}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-zinc-900">{profile.username}</h1>
                <p className="text-sm capitalize text-zinc-500">{profile.role} account</p>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 animate-in fade-in duration-200">
              {successMessage}
            </div>
          )}

          {updateProfile.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {updateProfile.error.message || 'An error occurred while saving your profile.'}
            </div>
          )}

          {profile.role === 'company' ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8">
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
            </div>
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
      headline: profile.headline || '',
      location: profile.location || '',
      phone_number: profile.phone_number || '',
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      gender: profile.gender || '',
      date_of_birth: profile.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : '',
      address: profile.address || '',
      province: profile.province || '',
      city: profile.city || '',
      current_address: profile.current_address || '',
      social_links: seedSocialLinks(profile),
      education: profile.education || [],
      experience: profile.experience || [],
      projects: profile.projects || [],
      achievements: profile.achievements || [],
      training: profile.training || [],
      languages: profile.languages || [],
    },
  });

  const skillsValue = watch('skills') || [];
  const languagesValue = watch('languages') || [];
  const avatarUrlWatch = watch('avatar_url');
  const resumeUrlWatch = watch('resume_url');
  const educationWatch = watch('education') || [];
  const experienceWatch = watch('experience') || [];
  const projectsWatch = watch('projects') || [];
  const achievementsWatch = watch('achievements') || [];
  const trainingWatch = watch('training') || [];
  const socialLinksWatch = watch('social_links') || [];

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState('');

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/auth/upload/', formData);
      setValue('avatar_url', data.url, { shouldValidate: true, shouldDirty: true });
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        'Failed to upload image. Please try again.';
      setAvatarUploadError(String(message));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    setResumeUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/auth/upload/', formData);
      setValue('resume_url', data.url, { shouldValidate: true, shouldDirty: true });
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        'Failed to upload resume. Please try again.';
      setResumeUploadError(String(message));
    } finally {
      setUploadingResume(false);
    }
  };

  // Helper functions for dynamic array fields
  const addEducation = () => {
    setValue('education', [...educationWatch, { degree: '', institution: '', location: '', dates: '' }]);
  };
  const removeEducation = (index: number) => {
    setValue('education', educationWatch.filter((_, i) => i !== index));
  };
  const updateEducationField = (index: number, field: string, value: string) => {
    const updated = [...educationWatch];
    updated[index] = { ...updated[index], [field]: value };
    setValue('education', updated);
  };

  const addExperience = () => {
    setValue('experience', [...experienceWatch, { position: '', company: '', dates: '', description: '' }]);
  };
  const removeExperience = (index: number) => {
    setValue('experience', experienceWatch.filter((_, i) => i !== index));
  };
  const updateExperienceField = (index: number, field: string, value: string) => {
    const updated = [...experienceWatch];
    updated[index] = { ...updated[index], [field]: value };
    setValue('experience', updated);
  };

  const addProject = () => {
    setValue('projects', [...projectsWatch, { title: '', date: '', description: '', url: '' }]);
  };
  const removeProject = (index: number) => {
    setValue('projects', projectsWatch.filter((_, i) => i !== index));
  };
  const updateProjectField = (index: number, field: string, value: string) => {
    const updated = [...projectsWatch];
    updated[index] = { ...updated[index], [field]: value };
    setValue('projects', updated);
  };

  const addAchievement = () => {
    setValue('achievements', [...achievementsWatch, '']);
  };
  const removeAchievement = (index: number) => {
    setValue('achievements', achievementsWatch.filter((_, i) => i !== index));
  };
  const updateAchievementField = (index: number, value: string) => {
    const updated = [...achievementsWatch];
    updated[index] = value;
    setValue('achievements', updated);
  };

  const addTraining = () => {
    setValue('training', [...trainingWatch, { title: '', date: '' }]);
  };
  const removeTraining = (index: number) => {
    setValue('training', trainingWatch.filter((_, i) => i !== index));
  };
  const updateTrainingField = (index: number, field: string, value: string) => {
    const updated = [...trainingWatch];
    updated[index] = { ...updated[index], [field]: value };
    setValue('training', updated);
  };

  const addSocialLink = () => {
    setValue('social_links', [...socialLinksWatch, { platform: 'github', url: '' }], {
      shouldDirty: true,
    });
  };
  const removeSocialLink = (index: number) => {
    setValue(
      'social_links',
      socialLinksWatch.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };
  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialLinksWatch];
    updated[index] = { ...updated[index], [field]: value };
    setValue('social_links', updated, { shouldDirty: true });
  };

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          ...data,
          date_of_birth: data.date_of_birth || null,
        })
      )}
      className="space-y-6"
    >
      <nav className="sticky top-16 z-20 -mx-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur-md">
        <div className="flex min-w-max gap-1.5">
          {PROFILE_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="about" className="scroll-mt-24 space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8">
          <div className="mb-5 border-b border-zinc-100 pb-4">
            <h2 className="text-lg font-bold text-zinc-900">About</h2>
            <p className="mt-1 text-sm text-zinc-500">Name, gender, date of birth, and bio.</p>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-800">First name</label>
                <input
                  {...register('first_name')}
                  type="text"
                  placeholder="First name"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Last name</label>
                <input
                  {...register('last_name')}
                  type="text"
                  placeholder="Last name"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Gender</label>
                <select
                  {...register('gender')}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
                >
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Date of birth</label>
                <input
                  {...register('date_of_birth')}
                  type="date"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800">About / Bio</label>
              <textarea
                {...register('bio')}
                placeholder="Tell employers about yourself, your technical summary, background, and goals..."
                rows={4}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
              />
              {errors.bio && <p className="mt-1.5 text-xs text-red-500">{errors.bio.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Profile photo</label>
              <input type="hidden" {...register('avatar_url')} />
              <div className="flex items-center gap-4">
                {avatarUrlWatch ? (
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrlWatch} alt="Profile preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-xs font-semibold text-zinc-500">
                    Photo
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarFileChange}
                    className="hidden"
                    id="avatar-file-upload"
                  />
                  <label
                    htmlFor="avatar-file-upload"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
                  >
                    {uploadingAvatar ? 'Uploading...' : avatarUrlWatch ? 'Change photo' : 'Upload from device'}
                  </label>
                  {avatarUploadError && <p className="mt-1.5 text-xs text-red-500">{avatarUploadError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8">
          <div className="mb-5 border-b border-zinc-100 pb-4">
            <h2 className="text-lg font-bold text-zinc-900">Address &amp; links</h2>
            <p className="mt-1 text-sm text-zinc-500">Location, social profiles, and resume or CV.</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Address</label>
              <input
                {...register('address')}
                type="text"
                placeholder="Street address / permanent address"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Province</label>
                <select
                  {...register('province')}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
                >
                  <option value="">Select province</option>
                  {NEPAL_PROVINCES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-800">City</label>
                <input
                  {...register('city')}
                  type="text"
                  placeholder="City"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Current Address</label>
              <input
                {...register('current_address')}
                type="text"
                placeholder="Where you currently live"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-800">Social links</label>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
                >
                  + Add link
                </button>
              </div>
              {socialLinksWatch.length === 0 ? (
                <p className="text-xs italic text-zinc-400">
                  Add GitHub, Portfolio, LinkedIn, Facebook, Instagram, or Twitter.
                </p>
              ) : (
                <div className="space-y-2">
                  {socialLinksWatch.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        value={item.platform}
                        onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm outline-none sm:w-44"
                      >
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <option key={platform.value} value={platform.value}>
                            {platform.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                        placeholder="https://"
                        className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white p-2.5 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialLink(idx)}
                        className="px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/30 p-5">
              <label className="flex items-center justify-between text-sm font-bold text-zinc-900">
                <span>Resume / CV</span>
                {resumeUrlWatch && (
                  <a
                    href={resumeUrlWatch}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Open in full window
                  </a>
                )}
              </label>
              <input type="hidden" {...register('resume_url')} />
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={onResumeFileChange}
                  className="hidden"
                  id="resume-file-upload"
                />
                <label
                  htmlFor="resume-file-upload"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
                >
                  {uploadingResume ? 'Uploading...' : resumeUrlWatch ? 'Replace resume' : 'Upload from device'}
                </label>
                {resumeUploadError && <p className="text-xs text-red-500">{resumeUploadError}</p>}
              </div>
              {resumeUrlWatch && (
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700">
                    <span>Resume Preview</span>
                  </div>
                  <div className="relative h-96 w-full bg-zinc-900">
                    <iframe src={resumeUrlWatch} className="h-full w-full border-0" title="Resume Preview" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ProfileSection
        id="education"
        title="Education"
        action={
          <button
            type="button"
            onClick={addEducation}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            + Add Education
          </button>
        }
      >
        {educationWatch.length === 0 ? (
          <p className="text-xs italic text-zinc-400">No education entries added yet.</p>
        ) : (
          <div className="space-y-3">
            {educationWatch.map((item: any, idx: number) => (
              <div key={idx} className="relative space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                <button
                  type="button"
                  onClick={() => removeEducation(idx)}
                  className="absolute top-3 right-3 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Degree (e.g. BACHELOR’S)"
                    value={item.degree || ''}
                    onChange={(e) => updateEducationField(idx, 'degree', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Institution (e.g. Nilkantha Multiple Campus)"
                    value={item.institution || ''}
                    onChange={(e) => updateEducationField(idx, 'institution', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Location (e.g. Kathmandu)"
                    value={item.location || ''}
                    onChange={(e) => updateEducationField(idx, 'location', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dates (e.g. April 1, 2022 - April 5, 2026)"
                    value={item.dates || ''}
                    onChange={(e) => updateEducationField(idx, 'dates', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        id="projects"
        title="Projects"
        action={
          <button
            type="button"
            onClick={addProject}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            + Add Project
          </button>
        }
      >
        {projectsWatch.length === 0 ? (
          <p className="text-xs italic text-zinc-400">No projects added yet.</p>
        ) : (
          <div className="space-y-3">
            {projectsWatch.map((item: any, idx: number) => (
              <div key={idx} className="relative space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                <button
                  type="button"
                  onClick={() => removeProject(idx)}
                  className="absolute top-3 right-3 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Project Title (e.g. Job Tracker)"
                    value={item.title || ''}
                    onChange={(e) => updateProjectField(idx, 'title', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Date (e.g. May 10, 2026)"
                    value={item.date || ''}
                    onChange={(e) => updateProjectField(idx, 'date', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Project Link / URL"
                    value={item.url || ''}
                    onChange={(e) => updateProjectField(idx, 'url', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <textarea
                  placeholder="Comprehensive project description..."
                  value={item.description || ''}
                  rows={2}
                  onChange={(e) => updateProjectField(idx, 'description', e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        id="experience"
        title="Experience"
        action={
          <button
            type="button"
            onClick={addExperience}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            + Add Experience
          </button>
        }
      >
        {experienceWatch.length === 0 ? (
          <p className="text-xs italic text-zinc-400">No experience entries added yet.</p>
        ) : (
          <div className="space-y-3">
            {experienceWatch.map((item: any, idx: number) => (
              <div key={idx} className="relative space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                <button
                  type="button"
                  onClick={() => removeExperience(idx)}
                  className="absolute top-3 right-3 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Position / Title"
                    value={item.position || ''}
                    onChange={(e) => updateExperienceField(idx, 'position', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Company / Organization"
                    value={item.company || ''}
                    onChange={(e) => updateExperienceField(idx, 'company', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dates (e.g. Jan 2025 - Present)"
                    value={item.dates || ''}
                    onChange={(e) => updateExperienceField(idx, 'dates', e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                  />
                </div>
                <textarea
                  placeholder="Description of responsibilities and achievements..."
                  value={item.description || ''}
                  rows={2}
                  onChange={(e) => updateExperienceField(idx, 'description', e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        id="skills"
        title="Skills & Tech Stack"
        description="Add the tools and technologies you work with."
      >
        <TagInput
          value={skillsValue}
          onChange={(tags) => setValue('skills', tags)}
          placeholder="Add skills (e.g. Django, React, TypeScript)..."
          error={errors.skills?.message}
        />
      </ProfileSection>

      <ProfileSection
        id="achievements"
        title="Achievements"
        action={
          <button
            type="button"
            onClick={addAchievement}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            + Add Achievement
          </button>
        }
      >
        {achievementsWatch.length === 0 ? (
          <p className="text-xs italic text-zinc-400">No achievements added yet.</p>
        ) : (
          <div className="space-y-2">
            {achievementsWatch.map((ach: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Achievement title / award..."
                  value={ach}
                  onChange={(e) => updateAchievementField(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeAchievement(idx)}
                  className="px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        id="training"
        title="Training"
        description="Courses and certifications."
        action={
          <button
            type="button"
            onClick={addTraining}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            + Add Training
          </button>
        }
      >
        {trainingWatch.length === 0 ? (
          <p className="text-xs italic text-zinc-400">No training entries added yet.</p>
        ) : (
          <div className="space-y-2">
            {trainingWatch.map((item: any, idx: number) => (
              <div key={idx} className="relative flex flex-col items-center gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Course / Certification (e.g. React.js)"
                  value={item.title || ''}
                  onChange={(e) => updateTrainingField(idx, 'title', e.target.value)}
                  className="w-full flex-1 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Date (e.g. April 3, 2026)"
                  value={item.date || ''}
                  onChange={(e) => updateTrainingField(idx, 'date', e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs focus:outline-none sm:w-48"
                />
                <button
                  type="button"
                  onClick={() => removeTraining(idx)}
                  className="px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        id="languages"
        title="Languages"
        description="Spoken and written languages."
      >
        <TagInput
          value={languagesValue}
          onChange={(tags) => setValue('languages', tags)}
          placeholder="Add languages (e.g. Nepali, English, Hindi)..."
        />
      </ProfileSection>

      <ProfileSection
        id="contact"
        title="Email & Phone"
        description="How employers can reach you."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Email</label>
            <input
              type="email"
              value={profile.email || ''}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 p-3 text-sm text-zinc-600"
            />
            <p className="mt-1 text-xs text-zinc-400">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Phone Number</label>
            <input
              {...register('phone_number')}
              type="text"
              placeholder="e.g. 9828989190"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950"
            />
          </div>
        </div>
      </ProfileSection>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer rounded-xl bg-zinc-950 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50"
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
    setValue,
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

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');

  const onLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/auth/upload/', formData);
      setValue('avatar_url', data.url, { shouldValidate: true, shouldDirty: true });
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        'Failed to upload logo. Please try again.';
      setLogoUploadError(String(message));
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-zinc-800">Company Logo</label>
        <div className="flex items-center gap-4">
          {avatarUrlWatch && (avatarUrlWatch.startsWith('http://') || avatarUrlWatch.startsWith('https://') || avatarUrlWatch.startsWith('/') || avatarUrlWatch.startsWith('data:')) && (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border bg-zinc-150">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlWatch} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onLogoFileChange}
            className="hidden"
            id="logo-file-upload"
          />
          <label
            htmlFor="logo-file-upload"
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
          >
            {uploadingLogo ? 'Uploading...' : avatarUrlWatch ? 'Replace logo' : 'Upload from device'}
          </label>
          {logoUploadError && <p className="text-xs text-red-500">{logoUploadError}</p>}
        </div>
        <input type="hidden" {...register('avatar_url')} />
        {errors.avatar_url && <p className="mt-1.5 text-xs text-red-500">{errors.avatar_url.message}</p>}
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
            placeholder="acme.co or https://acme.co"
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
