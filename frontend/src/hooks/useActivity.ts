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
    refetchInterval: 60_000,
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

export function useMarkSingleActivityRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/auth/activity/${id}/read/`);
      return data as { updated: number; unread_count: number };
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['activity-log'] });
      const previous = queryClient.getQueryData<ActivityLogResponse>(['activity-log']);

      if (previous) {
        let wasUnread = false;
        const updatedResults = previous.results.map((item) => {
          if (item.id === id) {
            if (!item.is_read) wasUnread = true;
            return { ...item, is_read: true };
          }
          return item;
        });

        queryClient.setQueryData<ActivityLogResponse>(['activity-log'], {
          ...previous,
          unread_count: wasUnread ? Math.max(0, previous.unread_count - 1) : previous.unread_count,
          results: updatedResults,
        });
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['activity-log'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}
