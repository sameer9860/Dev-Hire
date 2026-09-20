import { JobCardSkeleton } from '@/components/jobs/JobCardSkeleton';
import { JobDetailSkeleton } from '@/components/jobs/JobDetailSkeleton';

export function JobsPageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 animate-pulse">
              <div className="h-8 w-36 rounded-lg bg-zinc-200" />
              <div className="mt-2 h-4 w-56 rounded-md bg-zinc-100" />
            </div>
            <div className="h-10 w-32 rounded-lg bg-zinc-200 animate-pulse" />
          </div>

          <div className="mt-4 flex gap-2 animate-pulse">
            <div className="h-11 flex-1 rounded-lg bg-zinc-100" />
            <div className="h-11 w-11 rounded-lg bg-zinc-100" />
          </div>

          <div className="mt-4 flex flex-wrap gap-3 animate-pulse">
            <div className="h-9 w-28 rounded-lg bg-zinc-100" />
            <div className="h-9 w-28 rounded-lg bg-zinc-100" />
            <div className="h-9 w-24 rounded-lg bg-zinc-100" />
            <div className="h-9 w-28 rounded-lg bg-zinc-100" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Left: list skeletons (desktop) / card grid (mobile) */}
          <div className="col-span-1">
            <div className="hidden lg:block space-y-3">
              <div className="h-10 rounded-xl bg-zinc-50 border border-zinc-200 animate-pulse" />
              <div className="space-y-3 max-h-[calc(100vh-230px)] overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            </div>

            <div className="block lg:hidden">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: detail skeleton */}
          <div className="col-span-1 lg:col-span-3">
            <div className="mb-6 animate-pulse">
              <div className="h-5 w-24 rounded-md bg-zinc-200" />
            </div>
            <div className="hidden lg:block">
              <JobDetailSkeleton embedded />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
