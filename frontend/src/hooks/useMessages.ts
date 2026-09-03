'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DirectMessage, ContactMessage } from '@/types/api';
import { toast } from 'sonner';

export function useDirectMessages(userId?: number) {
  return useQuery<{ results: DirectMessage[]; count: number }>({
    queryKey: ['directMessages', userId],
    queryFn: async () => {
      const { data } = await api.get('/auth/messages/', {
        params: userId ? { user_id: userId } : undefined,
      });
      return data;
    },
    refetchInterval: 5000, // Auto-refresh messages every 5 seconds for real-time feel
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipient_id, subject, body }: { recipient_id?: number; subject?: string; body: string }) => {
      const { data } = await api.post('/auth/messages/', { recipient_id, subject, body });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
      toast.success('Message sent successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to send message');
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/auth/messages/read/');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
}

export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      subject: string;
      category: string;
      description: string;
      attachment_url?: string;
    }) => {
      const { data } = await api.post('/auth/contact/', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Your message has been sent to our team. We will get back to you soon!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to submit contact message');
    },
  });
}
