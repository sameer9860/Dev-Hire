import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ActivityLog, PaginatedResponse } from '@/types/api';

export function useActivityLog() {
  return useQuery<PaginatedResponse<ActivityLog>>({
    queryKey: ['activity-log'],
    queryFn: async () => {
      const { data } = await api.get('/auth/activity/');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
  });
}
