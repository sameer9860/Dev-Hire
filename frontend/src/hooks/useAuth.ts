import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types/api';
import { useRouter } from 'next/navigation';
import { setCookie, deleteCookie } from '@/lib/cookies';
import { toast } from 'sonner';

export function useMe() {
  // Defer localStorage until after mount so SSR HTML matches the first client render.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const hasToken = ready && !!localStorage.getItem('access_token');

  const query = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me/');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
    enabled: hasToken,
  });

  return {
    ...query,
    isLoading: !ready || query.isLoading,
  };
}

export function useLogin() {
  const router = useRouter();
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const { data } = await api.post('/auth/login/', credentials);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // Store in cookies for server-side Next.js middleware (30 days)
      const MAX_AGE = 30 * 24 * 60 * 60;
      setCookie('access_token', data.access, MAX_AGE);
      setCookie('refresh_token', data.refresh, MAX_AGE);
      
      toast.success("Welcome back! Signed in successfully.");
      router.push('/jobs');
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || error.message || "Failed to sign in.";
      toast.error(errMsg);
    }
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation<User, Error, RegisterRequest>({
    mutationFn: async (userData) => {
      const { data } = await api.post('/auth/register/', userData);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Account for ${data.username} created successfully!`);
      router.push('/login');
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let errMsg = "Registration failed.";
      if (data) {
        if (typeof data === 'string') {
          errMsg = data;
        } else if (data.username) {
          errMsg = `Username error: ${data.username.join(' ')}`;
        } else if (data.email) {
          errMsg = `Email error: ${data.email.join(' ')}`;
        } else if (data.detail) {
          errMsg = data.detail;
        } else {
          errMsg = Object.values(data).flat().join(' ');
        }
      } else {
        errMsg = error.message;
      }
      toast.error(errMsg);
    }
  });
}

function extractApiError(error: any, fallback: string) {
  const data = error.response?.data;
  if (!data) return error.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  const first = Object.values(data).flat()[0];
  return typeof first === 'string' ? first : fallback;
}

export function useChangePassword() {
  return useMutation<
    { detail: string },
    Error,
    { current_password: string; new_password: string; new_password2: string }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/change-password/', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully.');
    },
    onError: (error: any) => {
      toast.error(extractApiError(error, 'Failed to change password.'));
    },
  });
}

export function useDeleteAccount() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation<void, Error, { password: string }>({
    mutationFn: async (payload) => {
      await api.delete('/auth/delete-account/', { data: payload });
    },
    onSuccess: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      deleteCookie('access_token');
      deleteCookie('refresh_token');
      queryClient.clear();
      toast.success('Your account has been deleted.');
      router.push('/register');
    },
    onError: (error: any) => {
      toast.error(extractApiError(error, 'Failed to delete account.'));
    },
  });
}
