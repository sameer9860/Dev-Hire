/**
 * Checks whether a developer's profile meets the minimum required fields
 * for onboarding completion.
 *
 * Required (ALL must be truthy / non-empty):
 *  1. bio (About)
 *  2. address  (Address)
 *  3. at least one social link with a URL (Social Link)
 *  4. resume_url (Resume)
 *  5. at least one education entry (Education)
 *  6. at least one skill (Skills & Tech Stack)
 *  7. at least one language (Languages)
 *  8. phone_number (Phone)
 */
export function isDeveloperProfileComplete(profile: any): boolean {
  if (!profile) return false;

  const hasBio = typeof profile.bio === 'string' && profile.bio.trim().length > 0;
  const hasAddress =
    (typeof profile.address === 'string' && profile.address.trim().length > 0) ||
    (typeof profile.city === 'string' && profile.city.trim().length > 0) ||
    (typeof profile.province === 'string' && profile.province.trim().length > 0) ||
    (typeof profile.location === 'string' && profile.location.trim().length > 0);
  const hasSocialLink =
    (Array.isArray(profile.social_links) &&
      profile.social_links.some((l: any) => l?.url && String(l.url).trim().length > 0)) ||
    (typeof profile.github_url === 'string' && profile.github_url.trim().length > 0) ||
    (typeof profile.portfolio_url === 'string' && profile.portfolio_url.trim().length > 0);
  const hasResume =
    typeof profile.resume_url === 'string' && profile.resume_url.trim().length > 0;
  const hasEducation =
    Array.isArray(profile.education) && profile.education.length > 0;
  const hasSkills =
    Array.isArray(profile.skills) && profile.skills.length > 0;
  const hasLanguages =
    Array.isArray(profile.languages) && profile.languages.length > 0;
  const hasPhone =
    typeof profile.phone_number === 'string' && profile.phone_number.trim().length > 0;

  return (
    hasBio &&
    hasAddress &&
    hasSocialLink &&
    hasResume &&
    hasEducation &&
    hasSkills &&
    hasLanguages &&
    hasPhone
  );
}
