import { z } from 'zod';

export const developerProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be under 500 characters'),
  avatar_url: z.string().url('Enter a valid URL').or(z.literal('')),
  skills: z.array(z.string()),
  github_url: z.string().url('Enter a valid GitHub URL').or(z.literal('')),
  portfolio_url: z.string().url('Enter a valid URL').or(z.literal('')),
  resume_url: z.string().url('Enter a valid URL').or(z.literal('')),
});

export const companyProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be under 500 characters'),
  avatar_url: z.string().url('Enter a valid URL').or(z.literal('')),
  company_name: z.string().min(1, 'Company name is required'),
  company_website: z.string().url('Enter a valid website URL').or(z.literal('')),
  company_size: z.string(),
});

export type DeveloperProfileFormData = z.infer<typeof developerProfileSchema>;
export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;
