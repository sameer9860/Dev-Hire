'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, Job, ContactMessage, AdminStats } from '@/types/api';
import { toast } from 'sonner';

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const { data } = await api.get('/auth/admin/stats/');
      return data;
    },
  });
}

export function useAdminUsers(params?: { search?: string; role?: string; is_active?: string }) {
  return useQuery<{ results: User[]; count: number }>({
    queryKey: ['adminUsers', params],
    queryFn: async () => {
      const { data } = await api.get('/auth/admin/users/', { params });
      return data;
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active, role }: { id: number; is_active?: boolean; role?: string }) => {
      const { data } = await api.patch(`/auth/admin/users/${id}/`, { is_active, role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('User status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update user status');
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/auth/admin/users/${id}/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('User account deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    },
  });
}

export function useAdminJobs(params?: { search?: string; is_active?: string }) {
  return useQuery<{ results: Job[]; count: number }>({
    queryKey: ['adminJobs', params],
    queryFn: async () => {
      const { data } = await api.get('/auth/admin/jobs/', { params });
      return data;
    },
  });
}

export function useUpdateAdminJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { data } = await api.patch(`/auth/admin/jobs/${id}/`, { is_active });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Job posting updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update job');
    },
  });
}

export function useDeleteAdminJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/auth/admin/jobs/${id}/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Job posting deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete job');
    },
  });
}

export function useAdminContactMessages(params?: { category?: string; status?: string; search?: string }) {
  return useQuery<{ results: ContactMessage[]; count: number }>({
    queryKey: ['adminContactMessages', params],
    queryFn: async () => {
      const { data } = await api.get('/auth/admin/contact-messages/', { params });
      return data;
    },
  });
}

export function useUpdateAdminContactMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, admin_notes, reply }: { id: number; status?: string; admin_notes?: string; reply?: string }) => {
      const { data } = await api.patch(`/auth/admin/contact-messages/${id}/`, { status, admin_notes, reply });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminContactMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Contact message updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update message');
    },
  });
}
