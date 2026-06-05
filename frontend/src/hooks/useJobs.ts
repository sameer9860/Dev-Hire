import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Job, JobFormData, JobFilters, PaginatedResponse } from '@/types/api';
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

export function useMyJobs() {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      const { data } = await api.get('/jobs/my_jobs/');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  });
}