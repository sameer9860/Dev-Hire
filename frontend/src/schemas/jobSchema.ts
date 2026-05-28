import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().min(50, 'Requirements must be at least 50 characters'),
  location: z.string().min(2),
  is_remote: z.boolean(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  experience_level: z.enum(['junior', 'mid', 'senior']),
  tech_stack: z.array(z.string()).min(1, 'Add at least one technology'),
  salary_min: z.number().positive().nullable(),
  salary_max: z.number().positive().nullable(),
  deadline: z.string().min(1, 'Application deadline is required'),
}).refine((data) => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max > data.salary_min;
  }
  return true;
}, { message: 'Max salary must be greater than min', path: ['salary_max'] }).refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(data.deadline);
  return deadlineDate > today;
}, { message: 'Deadline must be in the future', path: ['deadline'] });

export type JobFormData = z.infer<typeof jobSchema>;