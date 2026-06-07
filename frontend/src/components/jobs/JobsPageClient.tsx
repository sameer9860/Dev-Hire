'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/jobs/JobCard';
import { JobCardSkeleton } from '@/components/jobs/JobCardSkeleton';
import { JobFiltersPanel } from '@/components/jobs/JobFilters';
import { Pagination } from '@/components/jobs/Pagination';
import type { JobFilters, JobType, ExperienceLevel } from '@/types/api';
import { Search, SlidersHorizontal, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function JobsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract query parameters from the URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const job_type = (searchParams.get('job_type') as JobType) || undefined;
  const experience_level = (searchParams.get('experience_level') as ExperienceLevel) || undefined;
  const is_remote_param = searchParams.get('is_remote');
  const is_remote = is_remote_param === 'true' ? true : is_remote_param === 'false' ? false : undefined;

  // Build the unified filters object for the backend query
  const filters: JobFilters = {
    page,
    search,
    job_type,
    experience_level,
    is_remote,
  };

  // Local state for the search input to ensure it is highly responsive
  const [searchInput, setSearchInput] = useState(search);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Keep local search input value synced with URL updates (e.g. on clear filters, or back button navigation)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Clean up timeouts on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Fetch data using the useJobs query hook
  const { data, isLoading, isError, refetch, isFetching } = useJobs(filters);

  // Debounced search updates URL query parameters
  const debouncedUpdateSearch = useCallback((value: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      // Always reset to page 1 on new searches
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 400);
  }, [pathname, router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedUpdateSearch(value);
  };

  // Select filters update URL parameters immediately (resets page to 1)
  const handleFilterChange = (newFilters: JobFilters) => {
    const params = new URLSearchParams(window.location.search);

    if (newFilters.job_type) {
      params.set('job_type', newFilters.job_type);
    } else {
      params.delete('job_type');
    }

    if (newFilters.experience_level) {
      params.set('experience_level', newFilters.experience_level);
    } else {
      params.delete('experience_level');
    }

    if (newFilters.is_remote !== undefined) {
      params.set('is_remote', String(newFilters.is_remote));
    } else {
      params.delete('is_remote');
    }

    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Page index update helper
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    if (newPage > 1) {
      params.set('page', String(newPage));
    } else {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Resets all parameters
  const clearFilters = () => {
    setSearchInput('');
    router.push(pathname, { scroll: false });
  };

  const jobs = data?.results ?? [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tech Jobs</h1>
              <p className="text-gray-600 mt-1">Find your next opportunity</p>
            </div>
            <Link href="/jobs/post">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Post a Job</Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs by title, description or keywords..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10 border-gray-200 focus-visible:ring-blue-500 focus-visible:border-blue-500"
              />
            </div>
            {/* Mobile filter button — only visible below lg */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden relative flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {(job_type || experience_level || is_remote !== undefined) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
              )}
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              aria-label="Refresh job listings"
            >
              <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar — Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow sticky top-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                  Filters
                </h2>
                {(job_type || experience_level || is_remote !== undefined || search) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <JobFiltersPanel filters={filters} onChange={handleFilterChange} />
            </div>
          </div>

          {/* Job Listings — full width on mobile, 3/4 on lg */}
          <div className="col-span-1 lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {isLoading ? 'Searching...' : `${data?.count ?? 0} Job${data?.count === 1 ? '' : 's'}`}
              </h2>
            </div>

            {/* Error */}
            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 font-semibold mb-2">Could not load jobs</p>
                <p className="text-red-600 text-sm mb-4">Please try again later</p>
                <Button onClick={() => refetch()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                  Retry
                </Button>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && jobs.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-600 font-medium mb-3">No jobs found</p>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your search query or filters</p>
                <Button onClick={clearFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Jobs Grid */}
            {!isLoading && !isError && jobs.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jobs.map((job, index) => (
                    <Link href={`/jobs/${job.id}`} key={job.id} className="block hover:scale-[1.01] transition-transform duration-200">
                      <JobCard job={job} index={index} />
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={page}
                  totalCount={data?.count ?? 0}
                  pageSize={10}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Slide-up panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h2>
              <div className="flex items-center gap-4">
                {(job_type || experience_level || is_remote !== undefined || search) && (
                  <button
                    onClick={() => { clearFilters(); setShowMobileFilters(false); }}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="px-6 py-5">
              <JobFiltersPanel filters={filters} onChange={(f) => { handleFilterChange(f); }} />
            </div>
            <div className="sticky bottom-0 bg-white px-6 pb-6 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Show {data?.count ?? 0} Result{data?.count === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-gray-500 text-sm font-medium">Loading search interface...</p>
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
