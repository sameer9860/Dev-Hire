'use client';

export function JobCardSkeleton() {
  return (
    <div className="border border-zinc-150 rounded-lg p-5 bg-white shadow-2xs animate-pulse space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Title skeleton */}
          <div className="h-5 bg-zinc-200 rounded w-3/4" />
          {/* Company & Location skeleton */}
          <div className="h-4 bg-zinc-100 rounded w-1/2" />
        </div>
        {/* Remote badge skeleton */}
        <div className="h-5 bg-zinc-200 rounded w-16" />
      </div>
      {/* Tech Stack tags skeleton */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-5 bg-zinc-100 rounded w-14 border border-zinc-150" />
        ))}
      </div>
      {/* Footer details skeleton */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-4 bg-zinc-150 rounded w-1/3" />
        <div className="h-4 bg-zinc-150 rounded w-1/4" />
      </div>
    </div>
  );
}
