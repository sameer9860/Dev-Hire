'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFiltersPanel } from '@/components/jobs/JobFilters';
import type { JobFilters } from '@/types/api';
import { Search, MapPin, Briefcase, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Premium Hero Section with Gradient and Glassmorphism Banner */}
      <header className="relative overflow-hidden bg-slate-950 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_40%)]" />
        
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/25 mb-3">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Find your next challenge
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Discover Tech Jobs
              </h1>
              <p className="mt-2 text-slate-400 text-lg max-w-xl">
                Explore handpicked developer roles at world-class companies. Filter, apply, and land your dream tech job today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/jobs/post">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 py-6 px-6 rounded-xl border-none">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating Search Bar with Glassmorphism */}
          <div className="w-full max-w-4xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl flex flex-col md:flex-row gap-2 mt-4">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search job titles, keywords, or tech stack..."
                value={filters.search || ''}
                onChange={handleSearchChange}
                className="w-full bg-transparent border-0 pl-12 pr-4 text-white placeholder-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-6"
              />
            </div>
            
            <div className="border-t border-white/10 md:border-t-0 md:border-l md:border-white/10 my-1 md:my-0" />

            <div className="flex items-center gap-2 px-2">
              <button 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition duration-150 flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  Filters
                </h2>
                {(filters.job_type || filters.experience_level || filters.is_remote !== undefined || filters.search) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <JobFiltersPanel filters={filters} onChange={setFilters} />
            </div>
          </div>

          {/* Job Listings Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {isLoading ? 'Searching jobs...' : `${data?.count ?? 0} Job${data?.count === 1 ? '' : 's'} Found`}
              </h2>
            </div>

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center my-6">
                <p className="text-red-700 font-semibold mb-2">Could not retrieve job listings.</p>
                <p className="text-red-500 text-sm mb-4">Please make sure the backend server is running and try again.</p>
                <Button onClick={() => refetch()} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading/Skeleton State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                      </div>
                      <div className="h-6 bg-slate-200 rounded-full w-16" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <div className="h-5 bg-blue-50/50 rounded-md w-14" />
                      <div className="h-5 bg-blue-50/50 rounded-md w-16" />
                      <div className="h-5 bg-blue-50/50 rounded-md w-12" />
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                      <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && jobs.length === 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-16 text-center shadow-sm">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No jobs match your search</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                  Try adjusting or clearing your filters to see more developer opportunities.
                </p>
                <Button 
                  onClick={clearFilters} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl py-2 px-5"
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Listings Grid */}
            {!isLoading && !isError && jobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <Link href={`/jobs/${job.id}`} key={job.id} className="block transition duration-200 hover:-translate-y-0.5">
                    <JobCard job={job} />
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
