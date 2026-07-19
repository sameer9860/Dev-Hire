import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User } from '@/types/api';

function extractApiError(error: any): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (!data) return error.message || 'An unknown error occurred.';
    if (typeof data === 'string') return data;
    if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    const first = Object.values(data).flat()[0];
    return typeof first === 'string' ? first : JSON.stringify(data);
  }
  return error?.message || 'An unknown error occurred.';
}

/**
 * Fetch the authenticated user's profile via the role-aware endpoint.
 */
export function useProfile() {
  return useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/profile/');
      return data;
    },
    retry: false,
  });
}

/**
 * Update the authenticated user's profile (PATCH).
 * Invalidates both 'profile' and 'me' query caches on success
 * so the Sidebar avatar/name stays in sync.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, Partial<User>>({
    mutationFn: async (profileData) => {
      try {
        const { data } = await api.patch('/auth/profile/', profileData, {
          headers: { 'Content-Type': 'application/json' },
        });
        return data;
      } catch (err: any) {
        throw new Error(extractApiError(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
    },
  });
}

/**
 * Fetch a public user profile by username.
 * Works for both developer and company profiles.
 */
export function usePublicProfile(username: string) {
  return useQuery<User>({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data } = await api.get(`/auth/profile/${username}/`);
      return data;
    },
    enabled: !!username,
  });
}
