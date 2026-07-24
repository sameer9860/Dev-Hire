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
      headline: profile.headline || '',
      location: profile.location || '',
      phone_number: profile.phone_number || '',
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header Info: Headline, Location, Phone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Headline / Professional Title</label>
          <input
            {...register('headline')}
            type="text"
            placeholder="e.g. full django,drf,react,next with ts"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Location</label>
          <input
            {...register('location')}
            type="text"
            placeholder="e.g. Dhading, Nepal"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Phone Number</label>
          <input
            {...register('phone_number')}
            type="text"
            placeholder="e.g. 9828989190"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
        </div>
      </div>

      {/* Avatar Image */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Avatar Image URL</label>
        <div className="flex gap-4 items-center">
          <input
            {...register('avatar_url')}
            type="text"
            placeholder="https://example.com/avatar.jpg"
            className="flex-1 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
          {avatarUrlWatch && (avatarUrlWatch.startsWith('http') || avatarUrlWatch.startsWith('/') || avatarUrlWatch.startsWith('data:')) && (
            <div className="w-10 h-10 rounded-full border bg-zinc-150 overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlWatch} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        
        <div className="mt-2 flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={onAvatarFileChange}
            className="hidden"
            id="avatar-file-upload"
          />
          <label
            htmlFor="avatar-file-upload"
            className="inline-flex items-center justify-center px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            {uploadingAvatar ? 'Uploading...' : 'Or upload from computer'}
          </label>
          {avatarUploadError && <p className="text-red-500 text-xs">{avatarUploadError}</p>}
        </div>
      </div>

      {/* Bio / About */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">About / Bio</label>
        <textarea
          {...register('bio')}
          placeholder="Tell employers about yourself, your technical summary, background, and goals..."
          rows={4}
          className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-zinc-50/50 hover:bg-zinc-50"
        />
        {errors.bio && <p className="text-red-500 text-xs mt-1.5">{errors.bio.message}</p>}
      </div>

      {/* Skills & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Skills &amp; Tech Stack</label>
          <TagInput
            value={skillsValue}
            onChange={(tags) => setValue('skills', tags)}
            placeholder="Add skills (e.g. Django, React, TypeScript)..."
            error={errors.skills?.message}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Languages</label>
          <TagInput
            value={languagesValue}
            onChange={(tags) => setValue('languages', tags)}
            placeholder="Add languages (e.g. Nepali, English, Hindi)..."
          />
        </div>
      </div>

      {/* Links (GitHub, Portfolio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">GitHub URL</label>
          <input
            {...register('github_url')}
            type="text"
            placeholder="https://github.com/your-username"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">Portfolio URL</label>
          <input
            {...register('portfolio_url')}
            type="text"
            placeholder="https://yourportfolio.dev"
            className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-zinc-50/50 hover:bg-zinc-50"
          />
        </div>
      </div>

      {/* Resume Section with URL and Computer Upload + Preview */}
      <div className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50/30 space-y-4">
        <label className="block text-sm font-bold text-zinc-900 flex items-center justify-between">
          <span>Resume (URL or Computer Upload)</span>
          {resumeUrlWatch && (
            <a
              href={resumeUrlWatch}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Open in full window
            </a>
          )}
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            {...register('resume_url')}
            type="text"
            placeholder="Paste Google Drive / hosted resume URL or upload below..."
            className="flex-1 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-950 outline-none bg-white"
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={onResumeFileChange}
            className="hidden"
            id="resume-file-upload"
          />
          <label
            htmlFor="resume-file-upload"
            className="inline-flex items-center justify-center px-4 py-3 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 cursor-pointer transition-colors shadow-xs flex-shrink-0 disabled:opacity-50"
          >
            {uploadingResume ? 'Uploading...' : 'Upload from computer'}
          </label>
        </div>
        {resumeUploadError && <p className="text-red-500 text-xs">{resumeUploadError}</p>}

        {/* Live Resume Previewer */}
        {resumeUrlWatch && (
          <div className="mt-4 border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 border-b border-zinc-200 flex justify-between items-center">
              <span>Resume Preview</span>
              <span className="text-zinc-400 font-mono text-[10px] truncate max-w-xs">{resumeUrlWatch}</span>
            </div>
            <div className="h-96 w-full relative bg-zinc-900">
              <iframe
                src={resumeUrlWatch}
                className="w-full h-full border-0"
                title="Resume Preview"
              />
            </div>
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900">Education</h3>
          <button
            type="button"
            onClick={addEducation}
            className="text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition"
          >
            + Add Education
          </button>
        </div>
        {educationWatch.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No education entries added yet.</p>
        ) : (
          educationWatch.map((item: any, idx: number) => (
            <div key={idx} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/50 space-y-3 relative">
              <button
                type="button"
                onClick={() => removeEducation(idx)}
                className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Degree (e.g. BACHELOR’S)"
                  value={item.degree || ''}
                  onChange={(e) => updateEducationField(idx, 'degree', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Institution (e.g. Nilkantha Multiple Campus)"
                  value={item.institution || ''}
                  onChange={(e) => updateEducationField(idx, 'institution', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Kathmandu)"
                  value={item.location || ''}
                  onChange={(e) => updateEducationField(idx, 'location', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dates (e.g. April 1, 2022 - April 5, 2026)"
                  value={item.dates || ''}
                  onChange={(e) => updateEducationField(idx, 'dates', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Experience Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900">Experience</h3>
          <button
            type="button"
            onClick={addExperience}
            className="text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition"
          >
            + Add Experience
          </button>
        </div>
        {experienceWatch.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No experience entries added yet.</p>
        ) : (
          experienceWatch.map((item: any, idx: number) => (
            <div key={idx} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/50 space-y-3 relative">
              <button
                type="button"
                onClick={() => removeExperience(idx)}
                className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Position / Title"
                  value={item.position || ''}
                  onChange={(e) => updateExperienceField(idx, 'position', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company / Organization"
                  value={item.company || ''}
                  onChange={(e) => updateExperienceField(idx, 'company', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dates (e.g. Jan 2025 - Present)"
                  value={item.dates || ''}
                  onChange={(e) => updateExperienceField(idx, 'dates', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
              </div>
              <textarea
                placeholder="Description of responsibilities and achievements..."
                value={item.description || ''}
                rows={2}
                onChange={(e) => updateExperienceField(idx, 'description', e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
              />
            </div>
          ))
        )}
      </div>

      {/* Projects Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900">Projects</h3>
          <button
            type="button"
            onClick={addProject}
            className="text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition"
          >
            + Add Project
          </button>
        </div>
        {projectsWatch.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No projects added yet.</p>
        ) : (
          projectsWatch.map((item: any, idx: number) => (
            <div key={idx} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/50 space-y-3 relative">
              <button
                type="button"
                onClick={() => removeProject(idx)}
                className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Project Title (e.g. Job Tracker)"
                  value={item.title || ''}
                  onChange={(e) => updateProjectField(idx, 'title', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Date (e.g. May 10, 2026)"
                  value={item.date || ''}
                  onChange={(e) => updateProjectField(idx, 'date', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Project Link / URL"
                  value={item.url || ''}
                  onChange={(e) => updateProjectField(idx, 'url', e.target.value)}
                  className="border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
                />
              </div>
              <textarea
                placeholder="Comprehensive project description..."
                value={item.description || ''}
                rows={2}
                onChange={(e) => updateProjectField(idx, 'description', e.target.value)}
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
              />
            </div>
          ))
        )}
      </div>

      {/* Achievements Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900">Achievements</h3>
          <button
            type="button"
            onClick={addAchievement}
            className="text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition"
          >
            + Add Achievement
          </button>
        </div>
        {achievementsWatch.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No achievements added yet.</p>
        ) : (
          achievementsWatch.map((ach: string, idx: number) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Achievement title / award..."
                value={ach}
                onChange={(e) => updateAchievementField(idx, e.target.value)}
                className="flex-1 border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeAchievement(idx)}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 font-medium"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Training Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900">Training &amp; Certifications</h3>
          <button
            type="button"
            onClick={addTraining}
            className="text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition"
          >
            + Add Training
          </button>
        </div>
        {trainingWatch.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No training entries added yet.</p>
        ) : (
          trainingWatch.map((item: any, idx: number) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center relative">
              <input
                type="text"
                placeholder="Course / Certification (e.g. React.js)"
                value={item.title || ''}
                onChange={(e) => updateTrainingField(idx, 'title', e.target.value)}
                className="flex-1 border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none w-full"
              />
              <input
                type="text"
                placeholder="Date (e.g. April 3, 2026)"
                value={item.date || ''}
                onChange={(e) => updateTrainingField(idx, 'date', e.target.value)}
                className="w-full sm:w-48 border border-zinc-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeTraining(idx)}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 font-medium"
              >
                Remove
              </button>
            </div>
          ))
        )}
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

        <div className="mt-2 flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={onLogoFileChange}
            className="hidden"
            id="logo-file-upload"
          />
          <label
            htmlFor="logo-file-upload"
            className="inline-flex items-center justify-center px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            {uploadingLogo ? 'Uploading...' : 'Or upload from computer'}
          </label>
          {logoUploadError && <p className="text-red-500 text-xs">{logoUploadError}</p>}
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
