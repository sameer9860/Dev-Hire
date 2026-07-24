'use client';

import { useRouter } from 'next/navigation';
import { usePublicProfile } from '@/hooks/useProfile';
import { useMe } from '@/hooks/useAuth';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { GitBranch, Globe, Link as LinkIcon, FileText, ArrowLeft, Building2, Mail } from 'lucide-react';
import Link from 'next/link';

export function PublicProfileClient({ username }: { username: string }) {
  const router = useRouter();
  
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
              
              {profile.headline && (
                <p className="text-sm font-semibold text-blue-600 mt-1">{profile.headline}</p>
              )}
              {profile.location && (
                <p className="text-xs text-zinc-500 mt-0.5">{profile.location}</p>
              )}

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
              <div className="space-y-8 border-t border-zinc-100 pt-6">
                {/* Education */}
                {profile.education && profile.education.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Education</h2>
                    <div className="space-y-3">
                      {profile.education.map((edu: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{edu.dates}</p>
                              <h3 className="text-sm font-bold text-zinc-900">{edu.degree}</h3>
                              <p className="text-xs font-medium text-zinc-700">{edu.institution}{edu.location ? `, ${edu.location}` : ''}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {profile.experience && profile.experience.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Experience</h2>
                    <div className="space-y-3">
                      {profile.experience.map((exp: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-sm font-bold text-zinc-900">{exp.position}</h3>
                              <p className="text-xs font-medium text-zinc-700">{exp.company}</p>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">{exp.dates}</span>
                          </div>
                          {exp.description && <p className="text-xs text-zinc-600 mt-1 whitespace-pre-wrap">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {profile.projects && profile.projects.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Projects</h2>
                    <div className="space-y-3">
                      {profile.projects.map((proj: any, idx: number) => (
                        <div key={idx} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-zinc-500">{proj.date}</span>
                            {proj.url && (
                              <a href={proj.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline">
                                View
                              </a>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-zinc-900">{proj.title}</h3>
                          {proj.description && <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{proj.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {profile.achievements && profile.achievements.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Achievement</h2>
                    <ul className="list-disc list-inside space-y-1 text-xs text-zinc-700">
                      {profile.achievements.map((ach: string, idx: number) => (
                        <li key={idx}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Training */}
                {profile.training && profile.training.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Training</h2>
                    <div className="space-y-2">
                      {profile.training.map((tr: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/60">
                          <span className="font-semibold text-zinc-900">{tr.title}</span>
                          <span className="text-zinc-500">{tr.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info (Email, Phone, Location) */}
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Contact</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {profile.email && (
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                        <span className="text-zinc-400 font-semibold block mb-0.5">Email</span>
                        <a href={`mailto:${profile.email}`} className="text-zinc-900 font-medium hover:underline">{profile.email}</a>
                      </div>
                    )}
                    {profile.phone_number && (
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                        <span className="text-zinc-400 font-semibold block mb-0.5">Phone no.</span>
                        <span className="text-zinc-900 font-medium">{profile.phone_number}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 sm:col-span-2">
                        <span className="text-zinc-400 font-semibold block mb-0.5">Location</span>
                        <span className="text-zinc-900 font-medium">{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills & Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Skills</h2>
                    {profile.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((skill: string) => (
                          <span key={skill} className="px-2.5 py-1 bg-zinc-100 text-zinc-800 text-xs font-medium rounded-md border border-zinc-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-400 text-xs italic">No skills listed.</p>
                    )}
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Languages</h2>
                    {profile.languages && profile.languages.length > 0 ? (
                      <p className="text-xs text-zinc-700 font-medium">{profile.languages.join(', ')}</p>
                    ) : (
                      <p className="text-zinc-400 text-xs italic">No languages listed.</p>
                    )}
                  </div>
                </div>

                {/* Professional Links */}
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Social &amp; Links</h2>
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
                  </div>
                </div>

                {/* Resume Section with Viewer */}
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Resume</h2>
                  {profile.resume_url ? (
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div className="p-3 bg-zinc-100 border-b border-zinc-200 flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-700">Attached Resume</span>
                        <a
                          href={profile.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Open Full Window
                        </a>
                      </div>
                      <div className="h-96 w-full relative bg-zinc-900">
                        <iframe src={profile.resume_url} className="w-full h-full border-0" title="Resume Viewer" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-xs italic">No resume attached.</p>
                  )}
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
