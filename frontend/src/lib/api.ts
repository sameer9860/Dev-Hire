import axios from 'axios';
import { setCookie, deleteCookie } from '@/lib/cookies';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (!refresh) {
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${api.defaults.baseURL}/auth/token/refresh/`, { refresh });
        
        // Update localStorage
        localStorage.setItem('access_token', res.data.access);
        
        // Update cookie (30 days)
        const MAX_AGE = 30 * 24 * 60 * 60;
        setCookie('access_token', res.data.access, MAX_AGE);
        
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        deleteCookie('access_token');
        deleteCookie('refresh_token');
        
        toast.error("Your session has expired. Redirecting to login page...");
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;