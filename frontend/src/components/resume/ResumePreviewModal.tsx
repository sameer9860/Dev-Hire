'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileDown,
  ExternalLink,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass the signed URL fetched from the backend (never the raw Supabase public URL). */
  resumeUrl: string | null | undefined;
  isLoading?: boolean;
  candidateName?: string;
}

function isPdf(url: string) {
  try {
    const u = new URL(url);
    return u.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return url.toLowerCase().includes('.pdf');
  }
}

export function ResumePreviewModal({
  isOpen,
  onClose,
  resumeUrl,
  isLoading = false,
  candidateName,
}: ResumePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIframeLoaded(false);
      setIframeError(false);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Resume preview for ${candidateName || 'candidate'}`}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        style={{ height: 'min(90vh, 860px)' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
              <FileText className="h-4 w-4 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">
                {candidateName ? `${candidateName}'s Resume` : 'Resume Preview'}
              </p>
              <p className="text-[11px] text-zinc-500">
                {isLoading ? 'Generating secure link…' : 'Signed link · expires in 1 hour'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resumeUrl && (
              <>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Download
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-1 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close resume preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-hidden bg-zinc-100">
          {/* Loading signed URL */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-100">
              <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
              <p className="text-xs font-medium text-zinc-500">Generating secure link…</p>
            </div>
          )}

          {/* No URL (not loading) */}
          {!isLoading && !resumeUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <AlertCircle className="h-7 w-7 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-800">No resume available</p>
              <p className="max-w-xs text-xs text-zinc-500">
                This candidate hasn't uploaded a resume yet.
              </p>
            </div>
          )}

          {/* PDF iframe */}
          {!isLoading && resumeUrl && isPdf(resumeUrl) && (
            <>
              {!iframeLoaded && !iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-100">
                  <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
                  <p className="text-xs font-medium text-zinc-500">Loading PDF preview…</p>
                </div>
              )}
              {iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                    <AlertCircle className="h-7 w-7 text-zinc-400" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-800">Preview unavailable</p>
                  <p className="mt-1 max-w-xs text-xs text-zinc-500">
                    The PDF couldn't be embedded. Use the Open or Download buttons above.
                  </p>
                </div>
              )}
              <iframe
                key={resumeUrl}
                src={`${resumeUrl}#toolbar=1&navpanes=0`}
                className={`h-full w-full border-0 transition-opacity duration-300 ${
                  iframeLoaded && !iframeError ? 'opacity-100' : 'opacity-0'
                }`}
                title={`Resume of ${candidateName || 'candidate'}`}
                onLoad={() => setIframeLoaded(true)}
                onError={() => setIframeError(true)}
              />
            </>
          )}

          {/* Non-PDF */}
          {!isLoading && resumeUrl && !isPdf(resumeUrl) && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-200">
                <FileText className="h-10 w-10 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800">Resume on file</p>
                <p className="mt-1 max-w-xs text-xs text-zinc-500">
                  This file type can't be previewed inline. Use the Open or Download buttons above.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
