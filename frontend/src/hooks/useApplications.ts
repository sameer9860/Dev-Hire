import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Application, ApplicationStatus, PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

export function useMyApplications() {
  return useQuery<PaginatedResponse<Application>>({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const { data } = await api.get('/applications/');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
  });
}

export function useApply() {
  const queryClient = useQueryClient();
  return useMutation<Application, Error, { job: number; cover_letter: string }>({
    mutationFn: async (applicationData) => {
      const { data } = await api.post('/applications/', applicationData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success("Application submitted successfully!");
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to submit application.";
      toast.error(errMsg);
    }
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation<Application, Error, { id: number; status: ApplicationStatus; notes?: string }>({
    mutationFn: async ({ id, ...body }) => {
      const { data } = await api.patch(`/applications/${id}/status/`, body);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-applications'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success(`Application status updated to "${data.status}"`);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to update application status.";
      toast.error(errMsg);
    }
  });
}

export function useCompanyApplications() {
  return useQuery<PaginatedResponse<Application>>({
    queryKey: ['company-applications'],
    queryFn: async () => {
      const { data } = await api.get('/applications/');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
  });
}

export function useApplication(id: number) {
  return useQuery<Application>({
    queryKey: ['application', id],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${id}/`);
      return data;
    },
    enabled: !!id && typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  });
}

/**
 * Fetches a short-lived signed resume URL from the backend.
 * The raw Supabase URL stored in the DB is never exposed to the UI directly.
 * Set `enabled` to false until the user actually clicks "Preview" or "Download".
 */
export function useResumeUrl(applicationId: number | null, enabled: boolean = false) {
  return useQuery<{ resume_url: string | null; expires_in: number; source: string }>({
    queryKey: ['resume-url', applicationId],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${applicationId}/resume-url/`);
      return data;
    },
    enabled: !!applicationId && enabled,
    staleTime: 50 * 60 * 1000, // 50 min — refresh before 1-hour expiry
    gcTime: 60 * 60 * 1000,
    retry: false,
  });
}

export interface GeneratePitchPayload {
  job_id?: number;
  job_title?: string;
  company_name?: string;
  description?: string;
  requirements?: string;
  tech_stack?: string[];
  user_profile?: {
    name?: string;
    headline?: string;
    skills?: string[];
    projects?: any[];
    experience?: any[];
    bio?: string;
  };
}

export interface GeneratePitchResponse {
  cover_letter: string;
  pitch?: string;
  ai_enhanced: boolean;
}

export function useGeneratePitch() {
  return useMutation<GeneratePitchResponse, Error, GeneratePitchPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/applications/generate-pitch/', payload);
      return data;
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to generate pitch.";
      toast.error(errMsg);
    }
  });
}

