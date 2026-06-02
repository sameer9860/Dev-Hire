import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User } from '@/types/api';

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
 * so the Navbar avatar/name stays in sync.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, Partial<User>>({
    mutationFn: async (profileData) => {
      const { data } = await api.patch('/auth/profile/', profileData);
      return data;
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
