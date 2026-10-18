import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoadmapTask {
  id: number;
  title: string;
  description: string;
  category: 'learn' | 'build' | 'practice' | 'read' | 'apply';
  resource_url: string;
  week: number;
  order: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface Roadmap {
  id: number;
  target_role: string;
  duration_days: '30' | '60' | '90';
  skill_gaps: string[];
  summary: string;
  ai_enhanced: boolean;
  is_active: boolean;
  completion_percent: number;
  tasks: RoadmapTask[];
  created_at: string;
  updated_at: string;
}

export interface RoadmapListItem extends Omit<Roadmap, 'tasks'> {}

export interface AnalyzePayload {
  target_role: string;
  duration_days: 30 | 60 | 90;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** List all roadmaps for the authenticated developer. */
export function useRoadmaps() {
  return useQuery<RoadmapListItem[]>({
    queryKey: ['career-roadmaps'],
    queryFn: async () => {
      const { data } = await api.get('/career/roadmaps/');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
  });
}

/** Fetch a single roadmap with full task list. */
export function useRoadmapDetail(id: number | null) {
  return useQuery<Roadmap>({
    queryKey: ['career-roadmap', id],
    queryFn: async () => {
      const { data } = await api.get(`/career/roadmaps/${id}/detail/`);
      return data;
    },
    enabled: !!id,
    retry: false,
  });
}

/** Generate a new AI career roadmap. */
export function useAnalyzeCareer() {
  const queryClient = useQueryClient();
  return useMutation<Roadmap, Error, AnalyzePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/career/analyze/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-roadmaps'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success('🎯 Your personalized career roadmap is ready!');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || error.message || 'Failed to generate roadmap.';
      toast.error(msg);
    },
  });
}

/** Mark a task as completed. */
export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation<RoadmapTask, Error, { taskId: number; roadmapId: number }>({
    mutationFn: async ({ taskId }) => {
      const { data } = await api.post(`/career/tasks/${taskId}/complete/`);
      return data;
    },
    onSuccess: (data, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ['career-roadmap', roadmapId] });
      queryClient.invalidateQueries({ queryKey: ['career-roadmaps'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success(`Milestone completed: ${data.title}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to mark task complete.');
    },
  });
}

/** Unmark a completed task. */
export function useUncompleteTask() {
  const queryClient = useQueryClient();
  return useMutation<RoadmapTask, Error, { taskId: number; roadmapId: number }>({
    mutationFn: async ({ taskId }) => {
      const { data } = await api.post(`/career/tasks/${taskId}/uncomplete/`);
      return data;
    },
    onSuccess: (data, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ['career-roadmap', roadmapId] });
      queryClient.invalidateQueries({ queryKey: ['career-roadmaps'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.info(`Milestone reopened: ${data.title}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to unmark task.');
    },
  });
}

/** Delete a roadmap. */
export function useDeleteRoadmap() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (roadmapId) => {
      await api.delete(`/career/roadmaps/${roadmapId}/delete/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-roadmaps'] });
      toast.success('Roadmap deleted.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete roadmap.');
    },
  });
}
