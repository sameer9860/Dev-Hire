'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  Sparkles,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Trash2,
  Plus,
  BookOpen,
  Code2,
  Wrench,
  FileCheck,
  Rocket,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import {
  useRoadmaps,
  useRoadmapDetail,
  useAnalyzeCareer,
  useCompleteTask,
  useUncompleteTask,
  useDeleteRoadmap,
  RoadmapTask,
} from '@/hooks/useCareer';
import { useMe } from '@/hooks/useAuth';

// Suggested quick-select roles
const SUGGESTED_ROLES = [
  'Junior Django Developer',
  'Full-Stack Developer',
  'Frontend Developer (React)',
  'Backend Engineer (Python/Node)',
  'DevOps Engineer',
];

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: typeof BookOpen; badgeClass: string }
> = {
  learn: {
    label: 'Learn',
    icon: BookOpen,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  build: {
    label: 'Build',
    icon: Code2,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  practice: {
    label: 'Practice',
    icon: Wrench,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  read: {
    label: 'Read',
    icon: FileCheck,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  apply: {
    label: 'Apply',
    icon: Rocket,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export default function CareerCoachPage() {
  const { data: user } = useMe();
  const { data: roadmaps = [], isLoading: roadmapsLoading } = useRoadmaps();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);

  // Form states
  const [targetRole, setTargetRole] = useState('');
  const [durationDays, setDurationDays] = useState<30 | 60 | 90>(30);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mutations
  const analyzeMutation = useAnalyzeCareer();
  const completeMutation = useCompleteTask();
  const uncompleteMutation = useUncompleteTask();
  const deleteMutation = useDeleteRoadmap();

  // Active roadmap selection logic: default to first roadmap if none selected
  const activeRoadmapId = useMemo(() => {
    if (selectedRoadmapId !== null) return selectedRoadmapId;
    if (roadmaps.length > 0) return roadmaps[0].id;
    return null;
  }, [selectedRoadmapId, roadmaps]);

  const { data: roadmapDetail, isLoading: detailLoading } = useRoadmapDetail(activeRoadmapId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    try {
      const created = await analyzeMutation.mutateAsync({
        target_role: targetRole.trim(),
        duration_days: durationDays,
      });
      setSelectedRoadmapId(created.id);
      setShowCreateForm(false);
      setTargetRole('');
    } catch {
      // error handled by useAnalyzeCareer toast
    }
  };

  const handleToggleTask = (task: RoadmapTask) => {
    if (!activeRoadmapId) return;
    if (task.is_completed) {
      uncompleteMutation.mutate({ taskId: task.id, roadmapId: activeRoadmapId });
    } else {
      completeMutation.mutate({ taskId: task.id, roadmapId: activeRoadmapId });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this career roadmap?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          if (activeRoadmapId === id) {
            setSelectedRoadmapId(null);
          }
        },
      });
    }
  };

  // Group tasks by week
  const groupedTasks = useMemo(() => {
    if (!roadmapDetail?.tasks) return {};
    const groups: Record<number, RoadmapTask[]> = {};
    for (const task of roadmapDetail.tasks) {
      if (!groups[task.week]) groups[task.week] = [];
      groups[task.week].push(task);
    }
    return groups;
  }, [roadmapDetail]);

  const weeks = Object.keys(groupedTasks)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            <Link
              href="/dashboard/developer"
              className="inline-flex items-center gap-1 hover:text-zinc-600"
            >
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <span>/</span>
            <span>Career Coach</span>
          </div>
          <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-bold tracking-tight text-zinc-900">
            <Compass className="h-8 w-8 text-indigo-600" />
            AI Career Coach & Roadmap
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 sm:text-base">
            Personalized skill gap analysis & structured weekly milestones to land your target role.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          {showCreateForm ? (
            'Close Generator'
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Career Roadmap
            </>
          )}
        </button>
      </div>

      {/* Creation / Generator Form */}
      {(showCreateForm || roadmaps.length === 0) && (
        <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Google Gemini 2.0 Flash
            </div>

            <h2 className="mt-4 text-2xl font-bold text-zinc-900">
              Where do you want your career to go next?
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Tell us your target role. Our AI compares your current skills and projects against
              active market requirements to craft a step-by-step roadmap.
            </p>

            <form onSubmit={handleGenerate} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Target Role
                </label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Junior Django Developer, Full-Stack Engineer"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                />

                {/* Suggestions */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-xs text-zinc-400 py-1">Try:</span>
                  {SUGGESTED_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Roadmap Duration
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days as 30 | 60 | 90)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        durationDays === days
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-2 ring-indigo-200'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <span className="text-base font-bold">{days} Days</span>
                      <span className="text-xs text-zinc-500">
                        {days === 30 ? 'Sprint (4 wks)' : days === 60 ? 'Standard (8 wks)' : 'Deep Dive (12 wks)'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={analyzeMutation.isPending || !targetRole.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Analyzing Profile & Market...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Personalized Roadmap
                    </>
                  )}
                </button>

                {roadmaps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      {roadmapsLoading ? (
        <div className="space-y-4 py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-zinc-500">Loading your learning plans...</p>
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Target className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-zinc-900">No career roadmaps yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
            Create your first roadmap above to see tailored skill gap analysis and weekly milestones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: List of saved roadmaps */}
          <div className="space-y-3 lg:col-span-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Your Roadmaps ({roadmaps.length})
              </h2>
            </div>

            <div className="space-y-2.5">
              {roadmaps.map((r) => {
                const isSelected = r.id === activeRoadmapId;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoadmapId(r.id)}
                    className={`group relative cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-white shadow-sm ring-1 ring-indigo-500'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-bold text-zinc-900">{r.target_role}</h3>
                        </div>
                        <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                          <Calendar className="h-3 w-3" />
                          {r.duration_days} Days Plan
                          {r.ai_enhanced && (
                            <span className="inline-flex items-center gap-0.5 rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                              <Sparkles className="h-2.5 w-2.5" /> AI
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        title="Delete roadmap"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Progress Bar in card */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-600">Progress</span>
                        <span className="font-bold text-indigo-600">
                          {r.completion_percent}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${r.completion_percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Roadmap Detail View */}
          <div className="lg:col-span-8">
            {detailLoading ? (
              <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                <p className="mt-3 text-sm text-zinc-500">Loading roadmap details...</p>
              </div>
            ) : !roadmapDetail ? (
              <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center text-zinc-500">
                Select a roadmap on the left to view tasks.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Roadmap Header & Summary Card */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            roadmapDetail.ai_enhanced
                              ? 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                              : 'border border-zinc-200 bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {roadmapDetail.ai_enhanced ? (
                            <>
                              <Sparkles className="h-3 w-3" /> AI Personalized
                            </>
                          ) : (
                            <>
                              <Target className="h-3 w-3" /> Template Plan
                            </>
                          )}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {roadmapDetail.duration_days} Days ({weeks.length} Weeks)
                        </span>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                        {roadmapDetail.target_role}
                      </h2>
                    </div>

                    {/* Big Progress Badge */}
                    <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                      <div className="text-right">
                        <p className="text-xs font-medium text-zinc-500">Completion</p>
                        <p className="text-2xl font-black text-indigo-600">
                          {roadmapDetail.completion_percent}%
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {roadmapDetail.summary && (
                    <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 text-sm leading-relaxed text-zinc-700">
                      {roadmapDetail.summary}
                    </div>
                  )}

                  {/* Identified Skill Gaps */}
                  {roadmapDetail.skill_gaps && roadmapDetail.skill_gaps.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Identified Skill Gaps to Bridge:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {roadmapDetail.skill_gaps.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/60 px-3 py-1 text-xs font-semibold text-red-700"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Weekly Tasks Checklist */}
                <div className="space-y-6">
                  {weeks.map((week) => {
                    const tasks = groupedTasks[week] || [];
                    const completedInWeek = tasks.filter((t) => t.is_completed).length;

                    return (
                      <div
                        key={week}
                        className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xs"
                      >
                        {/* Week Header */}
                        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            <h3 className="font-bold text-zinc-900">Week {week}</h3>
                          </div>
                          <span className="text-xs font-medium text-zinc-500">
                            {completedInWeek} of {tasks.length} completed
                          </span>
                        </div>

                        {/* Task Rows */}
                        <div className="divide-y divide-zinc-100">
                          {tasks.map((task) => {
                            const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.learn;
                            const Icon = cat.icon;

                            return (
                              <div
                                key={task.id}
                                className={`flex items-start gap-4 p-5 transition hover:bg-zinc-50/50 ${
                                  task.is_completed ? 'bg-zinc-50/40 opacity-75' : ''
                                }`}
                              >
                                {/* Checkbox Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task)}
                                  className="mt-0.5 shrink-0 text-zinc-400 hover:text-indigo-600 transition"
                                >
                                  {task.is_completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="h-5 w-5" />
                                  )}
                                </button>

                                {/* Task Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cat.badgeClass}`}
                                    >
                                      <Icon className="h-2.5 w-2.5" />
                                      {cat.label}
                                    </span>
                                    <h4
                                      className={`text-sm font-semibold text-zinc-900 ${
                                        task.is_completed ? 'line-through text-zinc-400' : ''
                                      }`}
                                    >
                                      {task.title}
                                    </h4>
                                  </div>

                                  {task.description && (
                                    <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}

                                  {task.resource_url && (
                                    <a
                                      href={task.resource_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                    >
                                      Recommended Resource
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
