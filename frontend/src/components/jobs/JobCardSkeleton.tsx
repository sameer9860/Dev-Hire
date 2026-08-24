'use client';

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-5 w-3/4 rounded-md bg-zinc-200" />
          <div className="mt-2 h-4 w-1/2 rounded-md bg-zinc-100" />
        </div>
        <div className="h-6 w-16 rounded-full bg-zinc-200" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 w-16 rounded-md border border-zinc-200 bg-zinc-100" />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
        <div className="h-4 w-1/3 rounded-md bg-zinc-100" />
        <div className="h-4 w-1/4 rounded-md bg-zinc-100" />
      </div>
    </div>
  );
}
