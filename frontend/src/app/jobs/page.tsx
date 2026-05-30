'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFiltersPanel } from '@/components/jobs/JobFilters';
import type { JobFilters } from '@/types/api';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    job_type: undefined,
    experience_level: undefined,
    is_remote: undefined,
  });

  const { data, isLoading, isError, refetch, isFetching } = useJobs(filters);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      job_type: undefined,
      experience_level: undefined,
      is_remote: undefined,
    });
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
          <div className="flex gap-2">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs by title or keywords..."
                value={filters.search || ''}
                onChange={handleSearchChange}
                className="pl-10 border-gray-200"
              />
            </div>
            <button 
              onClick={() => refetch()} 
              disabled={isFetching}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow sticky top-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                  Filters
                </h2>
                {(filters.job_type || filters.experience_level || filters.is_remote !== undefined || filters.search) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <JobFiltersPanel filters={filters} onChange={setFilters} />
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            <div className="mb-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && jobs.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-600 font-medium mb-3">No jobs found</p>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your filters</p>
                <Button onClick={clearFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Jobs Grid */}
            {!isLoading && !isError && jobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job, index) => (
                  <Link href={`/jobs/${job.id}`} key={job.id} className="block hover:scale-105 transition-transform">
                    <JobCard job={job} index={index} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
