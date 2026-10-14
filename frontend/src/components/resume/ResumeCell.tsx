'use client';

import React, { useState } from 'react';
import { Eye, FileDown, Loader2 } from 'lucide-react';
import { useResumeUrl } from '@/hooks/useApplications';
import { ResumePreviewModal } from '@/components/resume/ResumePreviewModal';

interface ResumeCellProps {
  applicationId: number;
  /** Whether the application or developer has any resume on file (used to show N/A without a network call). */
  hasResume: boolean;
  candidateName?: string;
}

/**
 * Renders Preview + Download buttons for a resume in a table row.
 * Fetches the signed URL lazily only when the user clicks Preview.
 * The raw Supabase URL is never used in the browser.
 */
export function ResumeCell({ applicationId, hasResume, candidateName }: ResumeCellProps) {
  const [open, setOpen] = useState(false);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(false);

  const { data, isLoading } = useResumeUrl(applicationId, fetchEnabled);

  // If download was requested before the signed URL was ready, open it once it arrives
  React.useEffect(() => {
    if (pendingDownload && data?.resume_url) {
      setPendingDownload(false);
      window.open(data.resume_url, '_blank', 'noopener,noreferrer');
    }
  }, [pendingDownload, data?.resume_url]);

  if (!hasResume) {
    return <span className="text-xs text-zinc-400">N/A</span>;
  }

  const handlePreview = () => {
    setFetchEnabled(true);
    setOpen(true);
  };

  const handleDownload = () => {
    if (data?.resume_url) {
      window.open(data.resume_url, '_blank', 'noopener,noreferrer');
    } else {
      setPendingDownload(true);
      setFetchEnabled(true);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isLoading && !pendingDownload}
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:opacity-60"
          title="Preview resume"
        >
          {isLoading && !pendingDownload ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          Preview
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading && pendingDownload}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-60"
          title="Download resume"
        >
          {isLoading && pendingDownload ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-600" />
          ) : (
            <FileDown className="h-3.5 w-3.5 text-zinc-500" />
          )}
        </button>
      </div>

      <ResumePreviewModal
        isOpen={open}
        onClose={() => setOpen(false)}
        resumeUrl={data?.resume_url}
        isLoading={isLoading}
        candidateName={candidateName}
      />
    </>
  );
}
