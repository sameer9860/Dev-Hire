'use client';

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      {/* Top: logo + text */}
      <div className="flex items-start gap-3.5">
        {/* Company logo placeholder */}
        <div className="h-12 w-12 shrink-0 rounded-xl bg-zinc-100 border border-zinc-200" />

        {/* Title + company */}
        <div className="flex-1 min-w-0 space-y-2 pt-0.5">
          <div className="h-4 w-3/4 rounded-md bg-zinc-200" />
          <div className="h-3 w-1/2 rounded-md bg-zinc-100" />
        </div>
      </div>

      {/* Bottom: clock + view details */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-full bg-zinc-200" />
          <div className="h-3 w-16 rounded-md bg-zinc-100" />
        </div>
        <div className="h-3 w-20 rounded-md bg-zinc-100" />
      </div>
    </div>
  );
}

