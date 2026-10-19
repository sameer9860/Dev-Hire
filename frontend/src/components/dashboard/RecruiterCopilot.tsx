'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  useCopilotSearch,
  useCandidateSummary,
  useCopilotCompare,
  useInterviewQuestions,
  useDraftMessage,
  CandidateResult,
  SearchResult,
  CandidateSummary,
  ComparisonResult,
  InterviewQuestionsResult,
  DraftMessageResult,
} from '@/hooks/useCopilot';
import {
  Search,
  Sparkles,
  Users,
  FileText,
  GitCompare,
  MessageSquare,
  Mic,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Star,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Brain,
  Target,
  Zap,
  ArrowRight,
  X,
  BarChart3,
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { toast } from 'sonner';

// ── Utility ───────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : score >= 60
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-600 border-red-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-zinc-100 text-zinc-600',
    reviewing: 'bg-blue-50 text-blue-700',
    shortlisted: 'bg-violet-50 text-violet-700',
    rejected: 'bg-red-50 text-red-600',
    accepted: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Tab Types ─────────────────────────────────────────────────────────────────

type Tab = 'search' | 'compare' | 'interview' | 'message';

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'search', label: 'Smart Search', icon: Search, description: 'Find candidates with natural language' },
  { id: 'compare', label: 'Compare', icon: GitCompare, description: 'Side-by-side candidate analysis' },
  { id: 'interview', label: 'Interview Prep', icon: Mic, description: 'AI-tailored interview questions' },
  { id: 'message', label: 'Draft Message', icon: MessageSquare, description: 'Personalized outreach messages' },
];

// ── Search Tab ────────────────────────────────────────────────────────────────

function SearchTab() {
  const [query, setQuery] = useState('');
  const [jobId, setJobId] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [summary, setSummary] = useState<CandidateSummary | null>(null);

  const searchMutation = useCopilotSearch();
  const summaryMutation = useCandidateSummary();

  const suggestions = [
    'React developers with TypeScript experience',
    'Python backend engineers with 2+ years',
    'Full-stack developers who know PostgreSQL',
    'Candidates with open source contributions',
  ];

  const handleSearch = async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    const payload: { query: string; job_id?: number } = { query: searchQuery };
    if (jobId) payload.job_id = Number(jobId);
    const data = await searchMutation.mutateAsync(payload).catch(() => null);
    if (data) {
      // Normalise: some backend fallback responses may omit matched_candidates
      setResult({
        ...data,
        matched_candidates: data.matched_candidates ?? [],
      });
    }
  };

  const handleSummary = async (candidate: CandidateResult) => {
    setSelectedCandidate(candidate);
    setSummary(null);
    const data = await summaryMutation.mutateAsync({ application_id: candidate.id }).catch(() => null);
    if (data) setSummary(data);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
            <Brain className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Natural Language Search</p>
            <p className="text-xs text-zinc-500">Describe who you&apos;re looking for in plain English</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Senior React developer with Node.js experience..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <input
            type="number"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Job ID (opt)"
            className="w-28 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <button
            onClick={() => handleSearch()}
            disabled={searchMutation.isPending || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Search
          </button>
        </div>

        {/* Quick Suggestions */}
        {!result && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-zinc-400">Try:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {(result.matched_candidates ?? []).length} candidates matched
              </p>
              {result.search_insights && (
                <p className="mt-0.5 text-xs text-zinc-500">{result.search_insights}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {result.ai_enhanced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 border border-violet-200">
                  <Sparkles className="h-3 w-3" /> AI Enhanced
                </span>
              )}
              <button
                onClick={() => setResult(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {(result.matched_candidates ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">No candidates found for this query</p>
              <p className="mt-1 text-xs text-zinc-400">Try rephrasing or using broader terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {(result.matched_candidates ?? []).map((c) => (
                <div
                  key={c.id}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar name={c.name} src={c.avatar_url} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-zinc-900">{c.name}</p>
                          <p className="text-xs text-zinc-500">{c.headline || 'Developer'}</p>
                        </div>
                        {c.match_score !== undefined && <ScoreBadge score={c.match_score} />}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(c.skills ?? []).slice(0, 4).map((s) => (
                          <span key={s} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                            {s}
                          </span>
                        ))}
                        {(c.skills ?? []).length > 4 && (
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                            +{c.skills.length - 4}
                          </span>
                        )}
                      </div>
                      {c.match_reason && (
                        <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{c.match_reason}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <StatusBadge status={c.application_status} />
                        <button
                          onClick={() => handleSummary(c)}
                          disabled={summaryMutation.isPending && selectedCandidate?.id === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
                        >
                          {summaryMutation.isPending && selectedCandidate?.id === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          AI Summary
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Panel */}
      {selectedCandidate && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-600" />
              <p className="font-semibold text-zinc-900">
                AI Summary — {selectedCandidate.name}
              </p>
            </div>
            <button
              onClick={() => { setSelectedCandidate(null); setSummary(null); }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {summaryMutation.isPending && !summary ? (
            <div className="flex items-center gap-3 py-6 text-sm text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              Generating AI summary...
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-zinc-900">{summary.overall_fit_score}%</div>
                <div>
                  <p className="text-sm font-medium text-zinc-700">Overall Fit Score</p>
                  <p className="text-xs text-zinc-500">{summary.headline}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Strengths
                  </p>
                  <ul className="space-y-1.5">
                    {summary.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
                    Concerns
                  </p>
                  <ul className="space-y-1.5">
                    {summary.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-700">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-violet-200 bg-white p-4">
                <p className="mb-1 text-xs font-semibold text-violet-700">Recommendation</p>
                <p className="text-sm text-zinc-700">{summary.recommendation}</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">Standout Skills</p>
                <div className="flex flex-wrap gap-2">
                  {summary.standout_skills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                      <Star className="h-3 w-3" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Compare Tab ───────────────────────────────────────────────────────────────

function CompareTab() {
  const [idsInput, setIdsInput] = useState('');
  const [jobId, setJobId] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const compareMutation = useCopilotCompare();

  const handleCompare = async () => {
    const ids = idsInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (ids.length < 2) {
      toast.error('Enter at least 2 application IDs separated by commas.');
      return;
    }
    const payload: { application_ids: number[]; job_id?: number } = { application_ids: ids };
    if (jobId) payload.job_id = Number(jobId);
    const data = await compareMutation.mutateAsync(payload).catch(() => null);
    if (data) setResult(data);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Side-by-Side Comparison</p>
            <p className="text-xs text-zinc-500">Compare 2–4 candidates for the same role</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={idsInput}
            onChange={(e) => setIdsInput(e.target.value)}
            placeholder="Application IDs: 12, 34, 56"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="number"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Job ID (opt)"
            className="w-32 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={handleCompare}
            disabled={compareMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {compareMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitCompare className="h-4 w-4" />
            )}
            Compare
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Find Application IDs in your Applications page. Enter 2–4 IDs separated by commas.
        </p>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Winner Banner */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">
                Recommended: {result.recommended_candidate}
              </p>
            </div>
            <p className="text-xs text-emerald-700">{result.recommendation_reason}</p>
            {result.ai_enhanced && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <Sparkles className="h-3 w-3" /> AI Analysis
              </span>
            )}
          </div>

          {/* Candidate Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.candidates.map((c, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-5 ${
                  c.name === result.recommended_candidate
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="font-semibold text-zinc-900">{c.name}</p>
                  {c.name === result.recommended_candidate && (
                    <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      ★ Top Pick
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Overall</span>
                    <ScoreBadge score={c.overall_score} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Technical</span>
                    <ScoreBadge score={c.technical_score} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Experience</span>
                    <ScoreBadge score={c.experience_score} />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {c.skills_matched.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-emerald-700">Matched Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {c.skills_matched.slice(0, 4).map((s) => (
                          <span key={s} className="rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.skills_missing.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-red-600">Missing Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {c.skills_missing.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-md bg-red-50 border border-red-100 px-1.5 py-0.5 text-xs text-red-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs text-zinc-600 leading-relaxed">{c.verdict}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Interview Tab ─────────────────────────────────────────────────────────────

function InterviewTab() {
  const [appId, setAppId] = useState('');
  const [result, setResult] = useState<InterviewQuestionsResult | null>(null);
  const questionsMutation = useInterviewQuestions();

  const categoryColors: Record<string, string> = {
    technical: 'bg-blue-50 text-blue-700 border-blue-200',
    behavioral: 'bg-purple-50 text-purple-700 border-purple-200',
    cultural: 'bg-amber-50 text-amber-700 border-amber-200',
    situational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const handleGenerate = async () => {
    const id = parseInt(appId, 10);
    if (!id) {
      toast.error('Enter a valid Application ID.');
      return;
    }
    const data = await questionsMutation.mutateAsync({ application_id: id }).catch(() => null);
    if (data) setResult(data);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <Mic className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">AI Interview Questions</p>
            <p className="text-xs text-zinc-500">Tailored technical & behavioral questions for a specific applicant</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="Application ID"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
          <button
            onClick={handleGenerate}
            disabled={questionsMutation.isPending || !appId}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
          >
            {questionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900">{result.candidate_name}</p>
              <p className="text-xs text-zinc-500">for {result.job_title}</p>
            </div>
            {result.ai_enhanced && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                <Sparkles className="h-3 w-3" /> AI Enhanced
              </span>
            )}
          </div>

          <div className="space-y-3">
            {result.questions.map((q, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${categoryColors[q.category] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                    {q.category}
                  </span>
                  <span className="text-xs text-zinc-400">Q{i + 1}</span>
                </div>
                <p className="text-sm font-medium text-zinc-900">{q.question}</p>
                {q.rationale && (
                  <p className="mt-1.5 text-xs text-zinc-500 italic">{q.rationale}</p>
                )}
              </div>
            ))}
          </div>

          {result.interview_tips.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Zap className="h-4 w-4" />
                Interview Tips
              </p>
              <ul className="space-y-2">
                {result.interview_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Message Tab ───────────────────────────────────────────────────────────────

const MESSAGE_TYPES = [
  { value: 'interview_invite', label: 'Interview Invite' },
  { value: 'rejection', label: 'Rejection' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'offer', label: 'Job Offer' },
];

function MessageTab() {
  const [appId, setAppId] = useState('');
  const [msgType, setMsgType] = useState('interview_invite');
  const [extraDetails, setExtraDetails] = useState('');
  const [result, setResult] = useState<DraftMessageResult | null>(null);
  const draftMutation = useDraftMessage();

  const handleDraft = async () => {
    const id = parseInt(appId, 10);
    if (!id) {
      toast.error('Enter a valid Application ID.');
      return;
    }
    const data = await draftMutation
      .mutateAsync({ application_id: id, message_type: msgType, extra_details: extraDetails })
      .catch(() => null);
    if (data) setResult(data);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Draft Recruiter Message</p>
            <p className="text-xs text-zinc-500">Personalized outreach tailored to the candidate&apos;s profile</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="number"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Application ID"
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={msgType}
              onChange={(e) => setMsgType(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {MESSAGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={extraDetails}
            onChange={(e) => setExtraDetails(e.target.value)}
            placeholder="Optional: Add extra context (e.g. interview time, specific role details, salary range...)"
            rows={2}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            onClick={handleDraft}
            disabled={draftMutation.isPending || !appId}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {draftMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Draft Message
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900">
                {MESSAGE_TYPES.find((t) => t.value === result.message_type)?.label ?? result.message_type}
              </p>
              <p className="text-xs text-zinc-500 capitalize">Tone: {result.tone}</p>
            </div>
            <div className="flex items-center gap-2">
              {result.ai_enhanced && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <Sparkles className="h-3 w-3" /> AI Enhanced
                </span>
              )}
              <CopyButton text={`Subject: ${result.subject}\n\n${result.body}`} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Subject</p>
              <p className="text-sm font-medium text-zinc-900">{result.subject}</p>
            </div>
            <hr className="border-zinc-200" />
            <div>
              <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Body</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed">{result.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RecruiterCopilot() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            AI-Powered
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Recruiter Copilot
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Search candidates naturally, compare applicants, generate interview questions, and draft personalized messages.
          </p>
        </div>

      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition ${
                isActive
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-700'}`} />
              <div>
                <p className="text-sm font-semibold">{tab.label}</p>
                <p className={`text-xs ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'interview' && <InterviewTab />}
        {activeTab === 'message' && <MessageTab />}
      </div>
    </div>
  );
}
