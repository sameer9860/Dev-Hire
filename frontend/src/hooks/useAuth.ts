import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types/api';
import { useRouter } from 'next/navigation';
import { setCookie } from '@/lib/cookies';
import { toast } from 'sonner';

export function useMe() {
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me/');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
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
