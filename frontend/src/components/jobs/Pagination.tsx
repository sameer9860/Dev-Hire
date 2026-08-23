'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  itemLabel = 'jobs',
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPages();

  const startResult = (currentPage - 1) * pageSize + 1;
  const endResult = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-zinc-200 w-full">
      {/* Result stats */}
      <span className="text-xs sm:text-sm text-zinc-500 font-medium text-center sm:text-left">
        Showing <span className="text-zinc-900 font-semibold">{startResult}</span> to{' '}
        <span className="text-zinc-900 font-semibold">{endResult}</span> of{' '}
        <span className="text-zinc-900 font-semibold">{totalCount}</span> {itemLabel}
      </span>

      {/* Mobile controls (< sm) */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full max-w-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 px-3 text-xs font-semibold rounded-lg border-zinc-200 text-zinc-700 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        <span className="text-xs font-semibold text-zinc-700">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 px-3 text-xs font-semibold rounded-lg border-zinc-200 text-zinc-700 disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Desktop & Tablet controls (>= sm) */}
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 rounded-lg border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 text-xs font-semibold select-none"
              >
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <Button
              key={`page-${page}`}
              variant={isCurrent ? 'default' : 'outline'}
              onClick={() => onPageChange(page as number)}
              className={`h-9 w-9 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                isCurrent
                  ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm border-zinc-950'
                  : 'border-zinc-200 text-zinc-750 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 rounded-lg border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
