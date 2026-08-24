import { JobCardSkeleton } from '@/components/jobs/JobCardSkeleton';

export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
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
            <div className="h-11 w-11 rounded-lg bg-zinc-100" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden animate-pulse lg:block lg:col-span-1">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-5 h-5 w-20 rounded-md bg-zinc-200" />
              <div className="space-y-3">
                <div className="h-10 rounded-lg bg-zinc-100" />
                <div className="h-10 rounded-lg bg-zinc-100" />
                <div className="h-10 rounded-lg bg-zinc-100" />
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6 animate-pulse">
              <div className="h-5 w-24 rounded-md bg-zinc-200" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
