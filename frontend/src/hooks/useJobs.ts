import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Job, JobFormData, JobFilters, PaginatedResponse, MatchScoreResult, RankedApplicantsResponse, GenerateJobPostRequest, GenerateJobPostResponse } from '@/types/api';
import { toast } from 'sonner';

export function useJobs(filters: JobFilters = {}) {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const { data } = await api.get('/jobs/', { params: filters });
      return data;
    },
  });
}

export function useJob(id: number) {
  return useQuery<Job>({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${id}/`);
      return data;
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation<Job, Error, JobFormData>({
    mutationFn: async (jobData) => {
      const { data } = await api.post('/jobs/', jobData);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success(`Job listing "${data.title}" posted successfully!`);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to post job.";
      toast.error(errMsg);
    }
  });
}

export function useMyJobs(enabled = true) {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      const { data } = await api.get('/jobs/my_jobs/');
      return data;
    },
    enabled:
      enabled &&
      typeof window !== 'undefined' &&
      !!localStorage.getItem('access_token'),
  });
}

export function useToggleJobActive() {
  const queryClient = useQueryClient();
  return useMutation<Job, Error, { id: number; is_active: boolean }>({
    mutationFn: async ({ id, is_active }) => {
      const { data } = await api.patch(`/jobs/${id}/`, { is_active });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success(`Job status set to ${data.is_active ? 'Active' : 'Inactive'}.`);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to update job status.";
      toast.error(errMsg);
    }
  });
}

export function useJobMatch(jobId?: number, enabled = true) {
  return useQuery<MatchScoreResult>({
    queryKey: ['job-match', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${jobId}/match/`);
      return data;
    },
    enabled:
      enabled &&
      !!jobId &&
      typeof window !== 'undefined' &&
      !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60 * 30, // 30 mins
    retry: false,
  });
}

export function useRankedApplicants(jobId?: number | null, enabled = true) {
  return useQuery<RankedApplicantsResponse>({
    queryKey: ['ranked-applicants', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${jobId}/applicants-ranked/`);
      return data;
    },
    enabled:
      enabled &&
      !!jobId &&
      typeof window !== 'undefined' &&
      !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60 * 5, // 5 mins
    retry: false,
  });
}

export function useGenerateJobPost() {
  return useMutation<GenerateJobPostResponse, Error, GenerateJobPostRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/jobs/generate-post/', payload);
      return data;
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to generate job post with AI.";
      toast.error(errMsg);
    }
  });
}

export function useAuditJobDraft() {
  return useMutation<import('@/types/api').JobAuditResult, Error, Partial<JobFormData>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/jobs/audit-draft/', payload);
      return data;
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to audit job draft.";
      toast.error(errMsg);
    }
  });
}

export function useJobRecommendations(limit = 10, enabled = true) {
  return useQuery<{ results: import('@/types/api').PersonalizedJobRecommendation[]; count: number }>({
    queryKey: ['job-recommendations', limit],
    queryFn: async () => {
      const { data } = await api.get('/jobs/recommendations/', { params: { limit } });
      return data;
    },
    enabled:
      enabled &&
      typeof window !== 'undefined' &&
      !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useJobModerationQueue(enabled = true) {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['job-moderation-queue'],
    queryFn: async () => {
      const { data } = await api.get('/jobs/moderation-queue/');
      return data;
    },
    enabled:
      enabled &&
      typeof window !== 'undefined' &&
      !!localStorage.getItem('access_token'),
  });
}

export function useModerateJob() {
  const queryClient = useQueryClient();
  return useMutation<Job, Error, { id: number; action: 'approve' | 'reject'; notes?: string }>({
    mutationFn: async ({ id, action, notes }) => {
      const { data } = await api.post(`/jobs/${id}/moderate/`, { action, notes });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success(
        variables.action === 'approve'
          ? `Job "${data.title}" has been approved! ✨`
          : `Job "${data.title}" has been rejected.`
      );
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "Failed to moderate job.";
      toast.error(errMsg);
    }
  });
}