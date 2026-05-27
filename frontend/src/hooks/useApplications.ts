import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Application, ApplicationStatus, PaginatedResponse } from '@/types/api';

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
  return useMutation<Application, Error, { job: number; cover_letter: string; resume_url: string }>({
    mutationFn: async (applicationData) => {
      const { data } = await api.post('/applications/', applicationData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation<Application, Error, { id: number; status: ApplicationStatus; notes?: string }>({
    mutationFn: async ({ id, ...body }) => {
      const { data } = await api.patch(`/applications/${id}/status/`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-applications'] });
    },
  });
}
