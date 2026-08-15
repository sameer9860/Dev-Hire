'use client';

import Link from 'next/link';
import { useBookmarks, useRemoveBookmark } from '@/hooks/useBookmarks';
import type { PaginatedResponse, SavedJob } from '@/types/api';
import { Bookmark, Trash2 } from 'lucide-react';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function asList(data: PaginatedResponse<SavedJob> | SavedJob[] | undefined): SavedJob[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export function BookmarksPageClient() {
  const { data, isLoading, error } = useBookmarks();
  const removeBookmark = useRemoveBookmark();
  const bookmarks = asList(data);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm font-medium text-zinc-600">Loading saved jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Error loading saved jobs</h2>
        <p className="mt-1 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Saved Jobs</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Jobs you bookmarked to revisit later.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <Bookmark className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-zinc-900">No saved jobs yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Save roles from a job detail page to keep them here.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Find Jobs
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-500">S.N</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Title</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Deadline</th>
                  <th className="px-4 py-3 font-semibold text-zinc-500">Created At</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {bookmarks.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70"
                  >
                    <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${item.job.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {item.job.title}
                      </Link>
                      <div className="text-xs text-zinc-400">
                        {item.job.company.company_name || item.job.company.username}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                          item.job.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-600',
                        ].join(' ')}
                      >
                        {item.job.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(item.job.deadline)}</td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeBookmark.mutate(item.id)}
                        disabled={removeBookmark.isPending}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Remove ${item.job.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
