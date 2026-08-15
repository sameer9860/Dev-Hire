'use client';

import { BookmarksPageClient } from '@/components/dashboard/BookmarksPageClient';

export default function BookmarksPage() {
  return (
    <div className="min-h-full bg-zinc-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <BookmarksPageClient />
      </div>
    </div>
  );
}
