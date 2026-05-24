  import { z } from 'zod';

   export const loginSchema = z.object({
     username: z.string().min(3, 'Username must be at least 3 characters'),
     password: z.string().min(8, 'Password must be at least 8 characters'),
   });

   export const registerSchema = z.object({
     username: z.string().min(3).max(50),
     email: z.string().email('Enter a valid email address'),
     password: z.string().min(8, 'Minimum 8 characters'),
     password2: z.string(),
     role: z.enum(['developer', 'company']),
     company_name: z.string().optional(),
     company_website: z.string().url().optional().or(z.literal('')),
   }).refine((data) => data.password === data.password2, {
     message: "Passwords don't match",
     path: ['password2'],
   }).refine((data) => {
     if (data.role === 'company' && !data.company_name) return false;
     return true;
   }, { message: 'Company name is required', path: ['company_name'] });

   // Infer TypeScript types from Zod — no duplication!
   export type LoginFormData = z.infer<typeof loginSchema>;
   export type RegisterFormData = z.infer<typeof registerSchema>;