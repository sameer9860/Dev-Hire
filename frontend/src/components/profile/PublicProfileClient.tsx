'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicProfile } from '@/hooks/useProfile';
import { useMe } from '@/hooks/useAuth';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { GitBranch, Globe, Link as LinkIcon, FileText, ArrowLeft, Building2, Mail } from 'lucide-react';
import Link from 'next/link';
import { socialPlatformLabel } from '@/lib/profileOptions';
import type { SocialLink } from '@/types/api';

function ProfileSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8"
    >
      <h2 className="mb-4 border-b border-zinc-100 pb-3 text-lg font-bold text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}

export function PublicProfileClient({ username }: { username: string }) {
  const router = useRouter();

  const { data: profile, isLoading, error } = usePublicProfile(username);
  const { data: currentUser } = useMe();

  useEffect(() => {
    if (isLoading || !profile) return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [isLoading, profile]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50 p-4">
        <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-zinc-900">User Not Found</h2>
          <p className="mb-6 text-sm text-zinc-600">
            We couldn&apos;t find a profile for &quot;{username}&quot;. Please verify the URL or try searching again.
          </p>
          <button
            onClick={() => router.push('/jobs')}
            className="w-full rounded-xl bg-zinc-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Go to Jobs
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;
  const isDeveloper = profile.role === 'developer';

  return (
    <div className="min-h-screen bg-zinc-50/50 py-10">
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {isOwnProfile && (
            <Link
              href="/profile"
              className="flex items-center gap-1 text-sm font-semibold text-zinc-950 hover:underline"
            >
              Edit Profile
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="relative h-32 bg-gradient-to-r from-zinc-900 to-zinc-800">
            {isOwnProfile && (
              <span className="absolute top-4 right-4 rounded-full border border-white/10 bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md">
                This is you
              </span>
            )}
          </div>
          <div className="relative px-6 pb-8 sm:px-8">
            <div className="relative z-10 -mt-16 mb-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-950 text-4xl font-bold text-white shadow-md">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                  profile.username.substring(0, 2).toUpperCase()
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-3xl font-extrabold text-zinc-900">
                {profile.first_name || profile.last_name
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : profile.username}
              </h1>
              <span className="inline-flex items-center rounded-full border border-zinc-200/50 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 capitalize">
                {profile.role}
              </span>
            </div>
            {profile.headline && (
              <p className="mt-1 text-sm font-semibold text-blue-600">{profile.headline}</p>
            )}
            {profile.location && <p className="mt-0.5 text-xs text-zinc-500">{profile.location}</p>}
            {profile.role === 'company' && profile.company_name && (
              <p className="mt-1 flex items-center gap-1.5 text-lg font-medium text-zinc-800">
                <Building2 className="h-4 w-4 text-zinc-500" />
                {profile.company_name}
              </p>
            )}
          </div>
        </div>

        {isDeveloper ? (
          <>
            <section id="about" className="scroll-mt-24 space-y-6">
              <ProfileSection title="About">
                {(profile.first_name || profile.last_name) && (
                  <p className="mb-3 text-sm font-semibold text-zinc-900">
                    {`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}
                  </p>
                )}
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {profile.gender && (
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
                      <span className="mb-0.5 block text-xs font-semibold text-zinc-400">Gender</span>
                      <span className="text-sm font-medium text-zinc-900 capitalize">
                        {profile.gender.replaceAll('_', ' ')}
                      </span>
                    </div>
                  )}
                  {profile.date_of_birth && (
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
                      <span className="mb-0.5 block text-xs font-semibold text-zinc-400">Date of birth</span>
                      <span className="text-sm font-medium text-zinc-900">
                        {String(profile.date_of_birth).slice(0, 10)}
                      </span>
                    </div>
                  )}
                </div>
                {profile.bio ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-600">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-zinc-400 italic">No description provided yet.</p>
                )}
              </ProfileSection>

              <ProfileSection title="Address & links">
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {profile.address && (
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 sm:col-span-2">
                      <span className="mb-0.5 block text-xs font-semibold text-zinc-400">Address</span>
                      <span className="text-sm font-medium text-zinc-900">{profile.address}</span>
                    </div>
                  )}
                  {profile.province && (
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
                      <span className="mb-0.5 block text-xs font-semibold text-zinc-400">Province</span>
                      <span className="text-sm font-medium text-zinc-900">{profile.province}</span>
                    </div>
                  )}
                  {profile.city && (
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
                      <span className="mb-0.5 block text-xs font-semibold text-zinc-400">City</span>
                      <span className="text-sm font-medium text-zinc-900">{profile.city}</span>
                    </div>
                  )}
                  {profile.current_address && (
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 sm:col-span-2">
                      <span className="mb-0.5 block text-xs font-semibold text-zinc-400">Current Address</span>
                      <span className="text-sm font-medium text-zinc-900">{profile.current_address}</span>
                    </div>
                  )}
                </div>
                {(() => {
                  const links: SocialLink[] =
                    profile.social_links && profile.social_links.length > 0
                      ? profile.social_links.filter((item) => item.url)
                      : [
                          profile.github_url ? { platform: 'github', url: profile.github_url } : null,
                          profile.portfolio_url ? { platform: 'portfolio', url: profile.portfolio_url } : null,
                        ].filter(Boolean) as SocialLink[];
                  if (links.length === 0) {
                    return <p className="text-sm text-zinc-400 italic">No social links listed.</p>;
                  }
                  return (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {links.map((item, idx) => (
                        <a
                          key={`${item.platform}-${idx}`}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-zinc-200 p-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                        >
                          {item.platform === 'github' ? (
                            <GitBranch className="h-4 w-4 text-zinc-900" />
                          ) : (
                            <LinkIcon className="h-4 w-4 text-zinc-600" />
                          )}
                          {socialPlatformLabel(item.platform)}
                        </a>
                      ))}
                    </div>
                  );
                })()}
                {profile.resume_url && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 p-3 text-xs">
                      <span className="font-semibold text-zinc-700">Resume / CV</span>
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-bold text-blue-600 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Open Full Window
                      </a>
                    </div>
                    <div className="relative h-96 w-full bg-zinc-900">
                      <iframe src={profile.resume_url} className="h-full w-full border-0" title="Resume Viewer" />
                    </div>
                  </div>
                )}
              </ProfileSection>
            </section>

            <ProfileSection id="education" title="Education">
              {profile.education && profile.education.length > 0 ? (
                <div className="space-y-3">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5">
                      <p className="text-xs font-bold tracking-wider text-zinc-500 uppercase">{edu.dates}</p>
                      <h3 className="text-sm font-bold text-zinc-900">{edu.degree}</h3>
                      <p className="text-xs font-medium text-zinc-700">
                        {edu.institution}
                        {edu.location ? `, ${edu.location}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">No education listed.</p>
              )}
            </ProfileSection>

            <ProfileSection id="projects" title="Projects">
              {profile.projects && profile.projects.length > 0 ? (
                <div className="space-y-3">
                  {profile.projects.map((proj, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500">{proj.date}</span>
                        {proj.url && (
                          <a href={proj.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline">
                            View
                          </a>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900">{proj.title}</h3>
                      {proj.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{proj.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">No projects listed.</p>
              )}
            </ProfileSection>

            <ProfileSection id="experience" title="Experience">
              {profile.experience && profile.experience.length > 0 ? (
                <div className="space-y-3">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5">
                      <div className="mb-1 flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900">{exp.position}</h3>
                          <p className="text-xs font-medium text-zinc-700">{exp.company}</p>
                        </div>
                        <span className="text-xs font-medium text-zinc-500">{exp.dates}</span>
                      </div>
                      {exp.description && (
                        <p className="mt-1 text-xs whitespace-pre-wrap text-zinc-600">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">No experience listed.</p>
              )}
            </ProfileSection>

            <ProfileSection id="skills" title="Skills & Tech Stack">
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">No skills listed.</p>
              )}
            </ProfileSection>

            <ProfileSection id="achievements" title="Achievements">
              {profile.achievements && profile.achievements.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
                  {profile.achievements.map((ach, idx) => (
                    <li key={idx}>{ach}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-400 italic">No achievements listed.</p>
              )}
            </ProfileSection>

            <ProfileSection id="training" title="Training">
              {profile.training && profile.training.length > 0 ? (
                <div className="space-y-2">
                  {profile.training.map((tr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-zinc-200/60 bg-zinc-50 p-2.5 text-xs"
                    >
                      <span className="font-semibold text-zinc-900">{tr.title}</span>
                      <span className="text-zinc-500">{tr.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">No training listed.</p>
              )}
            </ProfileSection>

            <ProfileSection id="languages" title="Languages">
              {profile.languages && profile.languages.length > 0 ? (
                <p className="text-sm font-medium text-zinc-700">{profile.languages.join(', ')}</p>
              ) : (
                <p className="text-sm text-zinc-400 italic">No languages listed.</p>
              )}
            </ProfileSection>

            <ProfileSection id="contact" title="Email & Phone">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profile.email ? (
                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
                    <span className="mb-0.5 block text-xs font-semibold text-zinc-400">Email</span>
                    <a href={`mailto:${profile.email}`} className="text-sm font-medium text-zinc-900 hover:underline">
                      {profile.email}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">No email listed.</p>
                )}
                {profile.phone_number ? (
                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
                    <span className="mb-0.5 block text-xs font-semibold text-zinc-400">Phone</span>
                    <span className="text-sm font-medium text-zinc-900">{profile.phone_number}</span>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">No phone listed.</p>
                )}
              </div>
            </ProfileSection>
          </>
        ) : (
          <ProfileSection title="Company Overview">
            {profile.bio ? (
              <p className="mb-5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-600">{profile.bio}</p>
            ) : (
              <p className="mb-5 text-sm text-zinc-400 italic">No description provided yet.</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.company_website && (
                <div className="flex items-start gap-2.5">
                  <Globe className="mt-0.5 h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Website</p>
                    <a
                      href={profile.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm font-medium text-blue-600 hover:underline"
                    >
                      {profile.company_website}
                    </a>
                  </div>
                </div>
              )}
              {profile.company_size && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="mt-0.5 h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Company Size</p>
                    <p className="text-sm font-medium text-zinc-700">{profile.company_size} employees</p>
                  </div>
                </div>
              )}
            </div>
          </ProfileSection>
        )}
      </div>
    </div>
  );
}
