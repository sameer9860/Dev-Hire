import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ActivityLogResponse } from '@/types/api';

export function useActivityLog() {
  return useQuery<ActivityLogResponse>({
    queryKey: ['activity-log'],
    queryFn: async () => {
      const { data } = await api.get('/auth/activity/');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
  });
}

export function useMarkActivityRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/activity/read-all/');
      return data as { updated: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}
