export const SOCIAL_PLATFORMS = [
  { value: 'github', label: 'GitHub' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
] as const;

export const COMPANY_SOCIAL_PLATFORMS = [
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'slack', label: 'Slack' },
  { value: 'github', label: 'GitHub' },
] as const;

export const COMPANY_CATEGORIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Media',
  'Real Estate',
  'Logistics',
  'Agriculture',
  'Manufacturing',
  'Travel',
  'Hospitality',
  'Non-profit',
  'Consulting',
  'Telecommunications',
  'Construction',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['value'];

export const NEPAL_PROVINCES = [
  'Koshi',
  'Madhesh',
  'Bagmati',
  'Gandaki',
  'Lumbini',
  'Karnali',
  'Sudurpashchim',
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export function socialPlatformLabel(value: string) {
  const normalized = value?.toLowerCase();
  const all = [...SOCIAL_PLATFORMS, ...COMPANY_SOCIAL_PLATFORMS];
  return all.find((item) => item.value === normalized)?.label ?? value;
}
