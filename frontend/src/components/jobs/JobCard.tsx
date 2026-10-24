import type { Job, PersonalizedJobRecommendation } from '@/types/api';
import { Clock, ArrowRight, Sparkles, Target, ShieldCheck, AlertTriangle, Building2 } from 'lucide-react';

interface JobCardProps {
  job: Job | PersonalizedJobRecommendation;
  index?: number;
}

function getDaysLeft(deadline?: string | null, createdAt?: string | null): string {
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    // Normalize to end of deadline day
    deadlineDate.setHours(23, 59, 59, 999);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return `${diffDays} days left`;
    if (diffDays === 1) return '1 day left';
    if (diffDays === 0) return 'Closing today';
    return 'Closed';
  }

  if (createdAt) {
    const created = new Date(createdAt).getTime();
    // Default 30-day posting validity window if no explicit deadline
    const expiresAt = created + 30 * 24 * 60 * 60 * 1000;
    const diffTime = expiresAt - Date.now();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
  }

  return 'Active';
}

export function JobCard({ job }: JobCardProps) {
  const recData = (job as PersonalizedJobRecommendation).recommendation;
  const matchScore = recData ? (recData.skill_match_score ?? recData.score) : null;
  const matchLabel = recData?.badge;
  const hasSafetyFlags = job.safety_flags && job.safety_flags.length > 0;
  const daysLeft = getDaysLeft(job.deadline, job.created_at);

  const companyName = job.company?.company_name || job.company?.username || 'Company';
  const companyLogo = job.company?.avatar_url;
  const companyInitials = (companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2) || 'CO').toUpperCase();

  const matchBadgeStyle = matchScore !== null
    ? matchScore >= 80
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
      : matchScore >= 60
      ? 'bg-blue-50 text-blue-800 border-blue-200/80'
      : matchScore >= 40
      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
      : 'bg-rose-50 text-rose-800 border-rose-200/80'
    : '';

  const matchDotStyle = matchScore !== null
    ? matchScore >= 80
      ? 'bg-emerald-500'
      : matchScore >= 60
      ? 'bg-blue-500'
      : matchScore >= 40
      ? 'bg-amber-500'
      : 'bg-rose-500'
    : '';

  return (
    <div className="group rounded-2xl border border-gray-200/90 bg-white p-4.5 sm:p-5 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer relative flex flex-col justify-between">
      {/* Optional Match Header for Personalized Recommendations */}
      {recData && matchScore !== null && (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 border shadow-2xs whitespace-nowrap ${matchBadgeStyle}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${matchDotStyle} animate-pulse shrink-0`} />
            <Target className="h-3 w-3 shrink-0" />
            <span>{matchScore}% Match</span>
            {matchLabel && <span className="opacity-75 font-medium hidden sm:inline">· {matchLabel}</span>}
          </span>
          {job.is_remote && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-100">
              Remote
            </span>
          )}
        </div>
      )}

      {/* Main Content: Company Logo on Left + Title & Company Name on Right */}
      <div className="flex items-start gap-3.5">
        {/* Company Logo */}
        <div className="h-12 w-12 rounded-xl border border-gray-100 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          {companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companyLogo}
              alt={companyName}
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.fallback-initials');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className={`fallback-initials h-full w-full rounded-lg bg-zinc-900 text-white font-bold text-xs uppercase items-center justify-center ${companyLogo ? 'hidden' : 'flex'}`}
          >
            {companyInitials || <Building2 className="h-5 w-5 text-zinc-400" />}
          </div>
        </div>

        {/* Title and Company Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-gray-800 transition-colors">
              {job.title}
            </h3>
            {hasSafetyFlags ? (
              <span
                title="Listing caution detected"
                className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0"
              >
                <AlertTriangle className="h-2.5 w-2.5" /> Caution
              </span>
            ) : (job.quality_score ?? 100) >= 80 ? (
              <span
                title="Quality verified listing"
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0"
              >
                <ShieldCheck className="h-2.5 w-2.5" /> Verified
              </span>
            ) : null}
          </div>

          <p className="text-xs sm:text-[13px] font-medium text-zinc-500 line-clamp-1 mt-1 group-hover:text-zinc-600 transition-colors">
            {companyName}
          </p>
        </div>
      </div>

      {/* Top Recommendation Reason if applicable */}
      {recData && recData.reasons && recData.reasons.length > 0 && (
        <p className="mt-2 text-[11px] text-zinc-700 bg-zinc-50 rounded-md px-2 py-1 font-medium border border-zinc-200/60 line-clamp-1">
          ✓ {recData.reasons[0]}
        </p>
      )}

      {/* Bottom Row: Days Left on Left, View Details on Right (No salary, No applicants) */}
      <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 mt-3.5 text-xs">
        <div className="flex items-center gap-1.5 text-gray-900 font-medium">
          <Clock className="h-4 w-4 text-gray-800 shrink-0 stroke-[1.75]" />
          <span>{daysLeft}</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-500 group-hover:text-zinc-700 transition-colors">
          <span>View Details</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2] transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}