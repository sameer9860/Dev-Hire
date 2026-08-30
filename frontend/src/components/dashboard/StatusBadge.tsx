import type { ApplicationStatus } from '@/types/api';

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  reviewing: {
    label: 'Reviewing',
    className: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'border-purple-200 bg-purple-50 text-purple-800',
  },
  accepted: {
    label: 'Accepted',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  rejected: {
    label: 'Rejected',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}

