import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CandidateResult {
  id: number;
  developer_id: number;
  username: string;
  name: string;
  headline: string;
  skills: string[];
  match_score?: number;
  match_reason?: string;
  application_status: string;
  applied_at: string;
  job_title: string;
  avatar_url?: string;
}

export interface SearchResult {
  query: string;
  total_candidates: number;
  matched_candidates: CandidateResult[];
  search_insights?: string;
  ai_enhanced: boolean;
}

export interface CandidateSummary {
  candidate_name: string;
  overall_fit_score: number;
  headline: string;
  strengths: string[];
  concerns: string[];
  standout_skills: string[];
  recommendation: string;
  ai_enhanced: boolean;
}

export interface ComparisonCandidate {
  application_id: number;
  name: string;
  overall_score: number;
  technical_score: number;
  experience_score: number;
  skills_matched: string[];
  skills_missing: string[];
  verdict: string;
}

export interface ComparisonResult {
  job_title: string;
  recommended_candidate: string;
  recommendation_reason: string;
  candidates: ComparisonCandidate[];
  ai_enhanced: boolean;
}

export interface InterviewQuestion {
  category: string;
  question: string;
  rationale: string;
}

export interface InterviewQuestionsResult {
  candidate_name: string;
  job_title: string;
  questions: InterviewQuestion[];
  interview_tips: string[];
  ai_enhanced: boolean;
}

export interface DraftMessageResult {
  subject: string;
  body: string;
  tone: string;
  message_type: string;
  ai_enhanced: boolean;
}

// ── Search Hook ───────────────────────────────────────────────────────────────

export function useCopilotSearch() {
  return useMutation<SearchResult, Error, { query: string; job_id?: number }>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/copilot/search/', payload);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Search failed.');
    },
  });
}

// ── Candidate Summary Hook ────────────────────────────────────────────────────

export function useCandidateSummary() {
  return useMutation<CandidateSummary, Error, { application_id: number }>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/copilot/candidate-summary/', payload);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate summary.');
    },
  });
}

// ── Compare Hook ──────────────────────────────────────────────────────────────

export function useCopilotCompare() {
  return useMutation<ComparisonResult, Error, { application_ids: number[]; job_id?: number }>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/copilot/compare/', payload);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Comparison failed.');
    },
  });
}

// ── Interview Questions Hook ──────────────────────────────────────────────────

export function useInterviewQuestions() {
  return useMutation<InterviewQuestionsResult, Error, { application_id: number }>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/copilot/interview-questions/', payload);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate questions.');
    },
  });
}

// ── Draft Message Hook ────────────────────────────────────────────────────────

export function useDraftMessage() {
  return useMutation<
    DraftMessageResult,
    Error,
    { application_id: number; message_type?: string; extra_details?: string }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post('/copilot/draft-message/', payload);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to draft message.');
    },
  });
}
