import { JobCardSkeleton } from '@/components/jobs/JobCardSkeleton';

export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <header className="border-b border-gray-200 bg-white py-8 animate-pulse">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-9 bg-gray-200 rounded-lg w-1/6 mb-4" />
          <div className="h-4 bg-gray-150 rounded w-1/4 mb-8" />
          {/* Search bar row skeleton */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters sidebar skeleton */}
          <div className="hidden lg:block lg:col-span-1 animate-pulse">
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-8 bg-gray-100 rounded w-full" />
                <div className="h-8 bg-gray-100 rounded w-full" />
                <div className="h-8 bg-gray-100 rounded w-full" />
              </div>
            </div>
          </div>

          {/* Job listings grid skeleton */}
          <div className="col-span-1 lg:col-span-3">
            <div className="mb-6 h-5 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
