interface JobDetailSkeletonProps {
  /** Compact layout when shown inside the jobs master-detail panel */
  embedded?: boolean;
}

export function JobDetailSkeleton({ embedded = false }: JobDetailSkeletonProps) {
  const shell = embedded
    ? 'animate-pulse space-y-6 w-full'
    : 'min-h-screen bg-slate-50/50 flex items-center justify-center';
  const inner = embedded
    ? 'space-y-6 w-full'
    : 'animate-pulse space-y-6 w-full max-w-5xl px-4 py-12';

  return (
    <div className={shell}>
      <div className={inner}>
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="bg-white rounded-2xl p-8 space-y-4 border border-slate-100 shadow-sm">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 w-16 rounded bg-slate-100" />
            <div className="h-6 w-20 rounded bg-slate-100" />
          </div>
          <div className="h-32 bg-slate-50 rounded w-full mt-6" />
          <div className="space-y-2 mt-4">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-4/6" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="h-16 rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-16 rounded-xl bg-slate-50 border border-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
