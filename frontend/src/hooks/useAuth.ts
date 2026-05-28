import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types/api';
import { useRouter } from 'next/navigation';

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
      router.push('/jobs');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation<User, Error, RegisterRequest>({
    mutationFn: async (userData) => {
      const { data } = await api.post('/auth/register/', userData);
      return data;
    },
    onSuccess: () => router.push('/login'),
  });
}
