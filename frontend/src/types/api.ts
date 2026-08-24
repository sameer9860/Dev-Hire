export type UserRole = 'developer' | 'company' | 'guest';

   export interface EducationItem {
     institution?: string;
     degree?: string;
     dates?: string;
     location?: string;
   }

   export interface ExperienceItem {
     position?: string;
     company?: string;
     dates?: string;
     description?: string;
   }

   export interface ProjectItem {
     title?: string;
     date?: string;
     description?: string;
     url?: string;
   }

   export interface TrainingItem {
     title?: string;
     date?: string;
   }

   export interface SocialLink {
     platform: string;
     url: string;
   }

   export interface User {
     id: number;
     username: string;
     email: string;
     role: UserRole;
     bio: string;
     avatar_url: string;
     first_name?: string;
     last_name?: string;
     gender?: string;
     date_of_birth?: string | null;
     address?: string;
     province?: string;
     city?: string;
     current_address?: string;
     social_links?: SocialLink[];
     // Company fields
     company_name: string;
     company_website: string;
     company_size: string;
     company_category?: string;
     company_founded?: string;
     company_location?: string;
     company_address?: string;
     company_photos?: string[];
     company_social_links?: SocialLink[];
     recent_jobs?: Job[];
     // Developer fields
     resume_url: string;
     skills: string[];
     github_url: string;
     portfolio_url: string;
     headline?: string;
     location?: string;
     phone_number?: string;
     education?: EducationItem[];
     experience?: ExperienceItem[];
     projects?: ProjectItem[];
     achievements?: string[];
     training?: TrainingItem[];
     languages?: string[];
   }

   // Discriminated union — great TypeScript pattern for auth state
   export type AuthState =
     | { status: 'authenticated'; user: User; token: string }
     | { status: 'unauthenticated' }
     | { status: 'loading' };

   // ─── Jobs ────────────────────────────────────────────────────────
   export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
   export type ExperienceLevel = 'junior' | 'mid' | 'senior';

   export interface Job {
     id: number;
     company: User;
     title: string;
     description: string;
     requirements: string;
     location: string;
     is_remote: boolean;
     job_type: JobType;
     experience_level: ExperienceLevel;
     tech_stack: string[];
     salary_min: number | null;
     salary_max: number | null;
     is_active: boolean;
     created_at: string;
     updated_at: string;
     deadline: string | null;
     application_count: number;
     is_saved?: boolean;
   }

   export interface JobFormData {
     title: string;
     description: string;
     requirements: string;
     location: string;
     is_remote: boolean;
     job_type: JobType;
     experience_level: ExperienceLevel;
     tech_stack: string[];
     salary_min: number | null;
     salary_max: number | null;
     deadline: string | null;
   }

   // ─── Applications ─────────────────────────────────────────────────
   export type ApplicationStatus =
     | 'pending'
     | 'reviewing'
     | 'shortlisted'
     | 'accepted'
     | 'rejected';

   export interface Application {
     id: number;
     developer: User;
     job: Job;
     cover_letter: string;
     resume_url: string;
     status: ApplicationStatus;
     applied_at: string;
     updated_at: string;
     notes: string;
   }

   // ─── Bookmarks ────────────────────────────────────────────────────
   export interface SavedJob {
     id: number;
     job: Job;
     created_at: string;
   }

   // ─── Activity ─────────────────────────────────────────────────────
   export type ActivityCategory = 'application' | 'bookmark' | 'profile' | 'security';

   export interface ActivityLog {
     id: number;
     category: ActivityCategory;
     action: string;
     message: string;
     metadata: Record<string, unknown>;
     is_read: boolean;
     created_at: string;
   }

   // ─── API Utilities ─────────────────────────────────────────────────
   // Generic — your first real TypeScript generic!
   export interface PaginatedResponse<T> {
     count: number;
     next: string | null;
     previous: string | null;
     results: T[];
   }

   export interface ActivityLogResponse extends PaginatedResponse<ActivityLog> {
     unread_count: number;
   }

   // Utility types — you'll use these everywhere
   export type JobFilters = Partial<{
     search: string;
     job_type: JobType;
     experience_level: ExperienceLevel;
     is_remote: boolean;
     salary_min: number;
     salary_max: number;
     page: number;
     ordering: string;
   }>; 

   // Auth request/response shapes
   export interface LoginRequest {
     username: string;
     password: string;
   }

   export interface LoginResponse {
     access: string;
     refresh: string;
   }

   export interface RegisterRequest {
     username: string;
     email: string;
     password: string;
     password2: string;
     role: 'developer' | 'company';
     company_name?: string;
     company_website?: string;
   }

   // ─── Profile ──────────────────────────────────────────────────────
   export interface DeveloperProfileUpdate {
     bio: string;
     avatar_url: string;
     skills: string[];
     github_url: string;
     portfolio_url: string;
     resume_url: string;
     headline?: string;
     location?: string;
     phone_number?: string;
     first_name?: string;
     last_name?: string;
     gender?: string;
     date_of_birth?: string | null;
     address?: string;
     province?: string;
     city?: string;
     current_address?: string;
     social_links?: SocialLink[];
     education?: EducationItem[];
     experience?: ExperienceItem[];
     projects?: ProjectItem[];
     achievements?: string[];
     training?: TrainingItem[];
     languages?: string[];
   }

   export interface CompanyProfileUpdate {
     bio: string;
     avatar_url: string;
     company_name: string;
     company_website: string;
     company_size: string;
     company_category?: string;
     company_founded?: string;
     company_location?: string;
     company_address?: string;
     company_photos?: string[];
     company_social_links?: SocialLink[];
   }

   export type ProfileUpdate = DeveloperProfileUpdate | CompanyProfileUpdate;