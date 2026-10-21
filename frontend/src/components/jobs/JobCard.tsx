import type { Job, PersonalizedJobRecommendation } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { MatchScoreBadge } from '@/components/jobs/MatchScoreBadge';
import { Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

interface JobCardProps {
  job: Job | PersonalizedJobRecommendation;
  index?: number;
}

export function JobCard({ job, index = 0 }: JobCardProps) {
  const salaryDisplay = job.salary_min && job.salary_max
    ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
    : 'Salary not disclosed';

  const recData = (job as PersonalizedJobRecommendation).recommendation;
  const hasSafetyFlags = job.safety_flags && job.safety_flags.length > 0;

  const colors = [
    'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80',
    'bg-purple-50/70 hover:bg-purple-100/80 border-purple-200/80',
    'bg-green-50/70 hover:bg-green-100/80 border-green-200/80',
    'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80',
    'bg-pink-50/70 hover:bg-pink-100/80 border-pink-200/80',
  ];
  const colorClass = colors[index % colors.length];

  return (
    <div className={`${colorClass} border rounded-xl p-4.5 hover:shadow-md transition-all cursor-pointer relative`}>
      {/* Personalized Match Rationale Bar */}
      {recData && (
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-black/5 pb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white/80 rounded-md px-2 py-0.5 border border-indigo-100 shadow-2xs">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            {recData.score}% Profile Match · {recData.badge}
          </span>
          {job.is_remote && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 rounded px-1.5 py-0.5">
              Remote
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{job.title}</h3>
            {hasSafetyFlags ? (
              <span title="Listing caution detected" className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                <AlertTriangle className="h-2.5 w-2.5" /> Caution
              </span>
            ) : (job.quality_score ?? 100) >= 80 ? (
              <span title="Quality verified listing" className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                <ShieldCheck className="h-2.5 w-2.5" /> Verified
              </span>
            ) : null}
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {job.company.company_name} · {job.location}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!recData && <MatchScoreBadge jobId={job.id} size="sm" />}
          {!recData && job.is_remote && <Badge variant="secondary" className="whitespace-nowrap text-[10px]">Remote</Badge>}
        </div>
      </div>

      {/* Top Reason if recommendation */}
      {recData && recData.reasons && recData.reasons.length > 0 && (
        <p className="mt-2 text-[11px] text-zinc-700 bg-white/60 rounded-md px-2 py-1 font-medium border border-black/5">
          ✓ {recData.reasons[0]}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mt-2.5">
        {job.tech_stack.slice(0, 4).map((tech) => (
          <span key={tech} className="text-[10px] bg-white/80 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 font-medium">
            {tech}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-600 border-t border-black/5 pt-2">
        <span className="font-semibold text-zinc-800">{salaryDisplay}</span>
        <span>{job.application_count} applicants</span>
      </div>
    </div>
  );
}