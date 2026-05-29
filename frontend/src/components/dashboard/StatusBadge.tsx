import type { ApplicationStatus } from '@/types/api';

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
  reviewing: { label: 'Reviewing', className: 'bg-blue-100 text-blue-700' },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-yellow-100 text-yellow-700',
  },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${className}`}
    >
      {label}
    </span>
  );
}
