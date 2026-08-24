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
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch">
              <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                <h3 className="mb-4 text-sm font-bold tracking-[0.12em] text-zinc-500 uppercase">Company details</h3>

                <div className="space-y-3">
                  {profile.company_category && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Category</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-800">{profile.company_category}</p>
                    </div>
                  )}
                  {profile.company_founded && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Founded</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-800">{profile.company_founded}</p>
                    </div>
                  )}
                  {profile.company_location && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Location</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-800">{profile.company_location}</p>
                    </div>
                  )}
                  {profile.company_address && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Address</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-800">{profile.company_address}</p>
                    </div>
                  )}
                  {profile.company_website && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Website</p>
                      <a
                        href={profile.company_website.startsWith('http') ? profile.company_website : `https://${profile.company_website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {profile.company_website}
                      </a>
                    </div>
                  )}
                  {profile.company_size && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Company Size</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-800">{profile.company_size}</p>
                    </div>
                  )}
                </div>

                {(() => {
                  const links: SocialLink[] = profile.company_social_links && profile.company_social_links.length > 0
                    ? profile.company_social_links.filter((link) => link && link.url)
                    : profile.company_website
                      ? [{ platform: 'website', url: profile.company_website }]
                      : [];

                  if (links.length === 0) return null;

                  return (
                    <div className="mt-6">
                      <h4 className="mb-3 text-sm font-bold text-zinc-900">Social links</h4>
                      <div className="space-y-2">
                        {links.map((link, idx) => {
                          const platform = link.platform?.toLowerCase();
                          const icon =
                            platform === 'linkedin' ? (
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M6.94 8.5A1.56 1.56 0 1 1 6.94 5.4a1.56 1.56 0 0 1 0 3.1ZM5.5 9.7h2.9V18H5.5V9.7Zm5.1 0h2.8v1.12h.04c.4-.75 1.35-1.54 2.78-1.54 2.97 0 3.52 1.96 3.52 4.5V18h-2.9v-16.1c0-1.03-.02-2.36-1.43-2.36-1.44 0-1.66 1.12-1.66 2.28V18h-2.9V9.7Z" /></svg>
                            ) : platform === 'facebook' ? (
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V7.2c0-.87.24-1.47 1.5-1.47H17V3.1c-.26-.03-1.16-.1-2.2-.1-2.18 0-3.68 1.33-3.68 3.77V10H9v3h2.12v8h2.38Z" /></svg>
                            ) : platform === 'instagram' ? (
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.2A5.8 5.8 0 1 1 6.2 13 5.8 5.8 0 0 1 12 7.2Zm0 2A3.8 3.8 0 1 0 15.8 13 3.8 3.8 0 0 0 12 9.2Zm5.25-3.35a1.3 1.3 0 1 1-1.3-1.3 1.3 1.3 0 0 1 1.3 1.3Z" /></svg>
                            ) : platform === 'x' || platform === 'twitter' ? (
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M18.9 2h3.4l-7.4 8.45L23 22h-6.7l-5.24-7.09L4.97 22H1.53L9.3 12.08 1 2h6.86l4.73 6.53L18.9 2Zm-1.2 18h1.88L7.15 3.9H5.15L17.7 20Z" /></svg>
                            ) : platform === 'github' ? (
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M12 .5A12 12 0 0 0 8.21 23.4c.6.11.82-.26.82-.58v-2.12c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.72.08-.72 1.2.08 1.84 1.23 1.84 1.23 1.08 1.84 2.8 1.31 3.48.99.11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.23-3.21-.12-.3-.53-1.53.12-3.18 0 0 1-.32 3.3 1.23a11.3 11.3 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.77.83 1.23 1.9 1.23 3.21 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.11.81 2.24v3.32c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" /></svg>
                            ) : platform === 'slack' ? (
                              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M9.1 15.3c0 1.17-.95 2.12-2.12 2.12A2.12 2.12 0 0 1 4.86 15.3c0-1.17.95-2.12 2.12-2.12h2.12v2.12Zm1.06 0c0-1.17.95-2.12 2.12-2.12s2.12.95 2.12 2.12v5.3a2.12 2.12 0 0 1-4.24 0v-5.3ZM9.1 8.7c0-1.17.95-2.12 2.12-2.12s2.12.95 2.12 2.12v2.12H9.1V8.7Zm0-1.06c-1.17 0-2.12-.95-2.12-2.12S7.93 3.4 9.1 3.4h5.3a2.12 2.12 0 1 1 0 4.24H9.1Zm6.6 1.06c1.17 0 2.12.95 2.12 2.12S16.87 13.8 15.7 13.8h-2.12V8.7h2.12Zm-1.06 0c0-1.17-.95-2.12-2.12-2.12s-2.12.95-2.12 2.12v5.3a2.12 2.12 0 1 0 4.24 0V8.7Zm1.06 6.6c1.17 0 2.12.95 2.12 2.12S17.97 19.5 16.8 19.5H9.1a2.12 2.12 0 1 1 0-4.24h7.7Z" /></svg>
                            ) : (
                              <LinkIcon className="h-4 w-4" />
                            );

                          return (
                            <a
                              key={`${link.platform}-${idx}`}
                              href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                              aria-label={socialPlatformLabel(link.platform)}
                              title={socialPlatformLabel(link.platform)}
                            >
                              <span>{socialPlatformLabel(link.platform)}</span>
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700">
                                {icon}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </aside>

              <div className="w-full">
                <ProfileSection title="Company Overview">
                  {profile.bio ? (
                    <p className="mb-5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-600">{profile.bio}</p>
                  ) : (
                    <p className="mb-5 text-sm text-zinc-400 italic">No description provided yet.</p>
                  )}

                  {profile.company_photos && profile.company_photos.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-3 text-sm font-bold text-zinc-900">Gallery</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {profile.company_photos.map((photo, idx) => (
                          <img
                            key={`${photo}-${idx}`}
                            src={photo}
                            alt={`${profile.company_name} gallery ${idx + 1}`}
                            className="h-32 w-full rounded-xl object-cover border border-zinc-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </ProfileSection>
              </div>
            </div>

            {profile.recent_jobs && profile.recent_jobs.length > 0 && (
              <section className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8">
                <h2 className="mb-4 border-b border-zinc-100 pb-3 text-lg font-bold text-zinc-900">Recent jobs</h2>
                <div className="space-y-3">
                  {profile.recent_jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{job.title}</p>
                          <p className="text-xs text-zinc-600">{job.location}</p>
                        </div>
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-700">
                          {job.job_type}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
