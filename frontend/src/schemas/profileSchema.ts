import { z } from 'zod';

export const socialLinkSchema = z.object({
  platform: z.string(),
  url: z.string(),
});

export const developerProfileSchema = z.object({
  bio: z.string().max(2000, 'Bio must be under 2000 characters'),
  avatar_url: z.string().or(z.literal('')),
  skills: z.array(z.string()),
  github_url: z.string().or(z.literal('')),
  portfolio_url: z.string().or(z.literal('')),
  resume_url: z.string().or(z.literal('')),
  headline: z.string().optional(),
  location: z.string().optional(),
  phone_number: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  current_address: z.string().optional(),
  social_links: z.array(socialLinkSchema).optional(),
  education: z.array(z.any()).optional(),
  experience: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  achievements: z.array(z.any()).optional(),
  training: z.array(z.any()).optional(),
  languages: z.array(z.string()).optional(),
});

export const companyProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be under 500 characters'),
  avatar_url: z.string().or(z.literal('')),
  company_name: z.string().min(1, 'Company name is required'),
  company_website: z.string().refine((v) => {
    if (!v) return true;
    const valToTest = v.includes('://') ? v : `https://${v}`;
    return z.string().url().safeParse(valToTest).success;
  }, {
    message: 'Enter a valid website URL',
  }),
  company_size: z.string(),
  company_category: z.string().optional(),
  company_founded: z.string().optional(),
  company_location: z.string().optional(),
  company_address: z.string().optional(),
  company_photos: z.array(z.string()).max(5, 'Maximum 5 photos allowed').optional(),
  company_social_links: z.array(socialLinkSchema).optional(),
});

export type DeveloperProfileFormData = z.infer<typeof developerProfileSchema>;
export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;
