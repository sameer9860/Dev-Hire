  import { z } from 'zod';

   export const jobSchema = z.object({
     title: z.string().min(5, 'Title must be at least 5 characters').max(200),
     description: z.string().min(50, 'Please write a detailed description'),
     requirements: z.string().min(20, 'List the job requirements'),
     location: z.string().min(2),
     is_remote: z.boolean(),
     job_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
     experience_level: z.enum(['junior', 'mid', 'senior']),
     tech_stack: z.array(z.string()).min(1, 'Add at least one technology'),
     salary_min: z.number().positive().nullable(),
     salary_max: z.number().positive().nullable(),
     deadline: z.string().nullable(),
   }).refine((data) => {
     if (data.salary_min && data.salary_max) {
       return data.salary_max > data.salary_min;
     }
     return true;
   }, { message: 'Max salary must be greater than min', path: ['salary_max'] });

   export type JobFormData = z.infer<typeof jobSchema>;