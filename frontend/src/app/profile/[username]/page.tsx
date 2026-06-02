'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePublicProfile } from '@/hooks/useProfile';
import { useMe } from '@/hooks/useAuth';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { GitBranch, Globe, Link as LinkIcon, FileText, ArrowLeft, Building2, Briefcase, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const { data: profile, isLoading, error } = usePublicProfile(username);
  const { data: currentUser } = useMe();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md p-8 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">User Not Found</h2>
          <p className="text-zinc-600 text-sm mb-6">
            We couldn&apos;t find a profile for &quot;{username}&quot;. Please verify the URL or try searching again.
          </p>
          <button
            onClick={() => router.push('/jobs')}
            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Go to Jobs
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="min-h-screen bg-zinc-50/50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation & Header Actions */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {isOwnProfile && (
            <Link
              href="/profile"
              className="text-sm font-semibold text-zinc-950 hover:underline flex items-center gap-1"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
          {/* Header Banner Background */}
          <div className="h-32 bg-gradient-to-r from-zinc-900 to-zinc-800 relative">
            {isOwnProfile && (
              <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                This is you
              </span>
            )}
          </div>

          <div className="px-6 sm:px-8 pb-8 relative">
            {/* Avatar positioning */}
            <div className="-mt-16 mb-4 relative z-10">
              <div className="w-28 h-28 rounded-full border-4 border-white bg-zinc-950 flex items-center justify-center text-4xl text-white font-bold shadow-md overflow-hidden">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  profile.username.substring(0, 2).toUpperCase()
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="mb-6">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="text-3xl font-extrabold text-zinc-900">{profile.username}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 capitalize border border-zinc-200/50">
                  {profile.role}
                </span>
              </div>
              
              {profile.role === 'company' && profile.company_name && (
                <p className="text-lg font-medium text-zinc-800 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-zinc-500" />
                  {profile.company_name}
                </p>
              )}
            </div>

            {/* About / Bio Section */}
            <div className="border-t border-zinc-100 pt-6 mb-6">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2">About</h2>
              {profile.bio ? (
                <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="text-zinc-400 text-sm italic">No description provided yet.</p>
              )}
            </div>

            {/* Role Specific Details */}
            {profile.role === 'developer' ? (
              <div className="space-y-6 border-t border-zinc-100 pt-6">
                {/* Skills */}
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Skills &amp; Technologies</h2>
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-sm italic">No skills listed yet.</p>
                  )}
                </div>

                {/* Portfolio / Professional Links */}
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Professional Links</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-sm text-zinc-700 font-medium"
                      >
                        <GitBranch className="w-4 h-4 text-zinc-900" />
                        <span>GitHub Profile</span>
                      </a>
                    )}
                    {profile.portfolio_url && (
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-sm text-zinc-700 font-medium"
                      >
                        <LinkIcon className="w-4 h-4 text-zinc-600" />
                        <span>Personal Portfolio</span>
                      </a>
                    )}
                    {profile.resume_url && (
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-sm text-zinc-700 font-medium sm:col-span-2"
                      >
                        <FileText className="w-4 h-4 text-zinc-600" />
                        <span>View Resume / CV</span>
                      </a>
                    )}
                    {!profile.github_url && !profile.portfolio_url && !profile.resume_url && (
                      <p className="text-zinc-400 text-sm italic sm:col-span-2">No links posted yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 border-t border-zinc-100 pt-6">
                {/* Company Details */}
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Company Overview</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.company_website && (
                      <div className="flex items-start gap-2.5">
                        <Globe className="w-5 h-5 text-zinc-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Website</p>
                          <a
                            href={profile.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline font-medium break-all"
                          >
                            {profile.company_website}
                          </a>
                        </div>
                      </div>
                    )}

                    {profile.company_size && (
                      <div className="flex items-start gap-2.5">
                        <Building2 className="w-5 h-5 text-zinc-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Company Size</p>
                          <p className="text-sm text-zinc-700 font-medium">{profile.company_size} employees</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
