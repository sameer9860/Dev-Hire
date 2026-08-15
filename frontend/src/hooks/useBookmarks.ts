import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, SavedJob } from '@/types/api';
import { toast } from 'sonner';

export function useBookmarks() {
  return useQuery<PaginatedResponse<SavedJob> | SavedJob[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data } = await api.get('/bookmarks/');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation<
    SavedJob | void,
    Error,
    { jobId: number; saved: boolean }
  >({
    mutationFn: async ({ jobId, saved }) => {
      if (saved) {
        await api.delete(`/jobs/${jobId}/save/`);
        return;
      }
      const { data } = await api.post(`/jobs/${jobId}/save/`);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success(variables.saved ? 'Removed from saved jobs' : 'Job saved');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err.response?.data?.detail || err.message || 'Failed to update saved job.');
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (bookmarkId) => {
      await api.delete(`/bookmarks/${bookmarkId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success('Removed from saved jobs');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err.response?.data?.detail || err.message || 'Failed to remove saved job.');
    },
  });
}
