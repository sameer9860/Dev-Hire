'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ParsedResumeResult {
  resume_url: string;
  parsed_data: {
    first_name?: string;
    last_name?: string;
    headline?: string;
    bio?: string;
    phone_number?: string;
    location?: string;
    address?: string;
    github_url?: string;
    portfolio_url?: string;
    linkedin_url?: string;
    skills?: string[];
    education?: any[];
    experience?: any[];
    projects?: any[];
    achievements?: any[];
    training?: any[];
    languages?: string[];
    social_links?: { platform: string; url: string }[];
  };
}

interface ResumeParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParsed: (result: ParsedResumeResult) => void;
}

export function ResumeParserModal({ isOpen, onClose, onParsed }: ResumeParserModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedResumeResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setError(null);
      setIsLoading(false);
      setParsedPreview(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF resume file (.pdf).');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const handleParse = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setLoadingStep('Uploading and reading PDF resume...');

    const timer1 = setTimeout(() => {
      setLoadingStep('AI is analyzing experience & education...');
    }, 1500);

    const timer2 = setTimeout(() => {
      setLoadingStep('Extracting tech skills, projects & achievements...');
    }, 3500);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/auth/resume/parse/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data: ParsedResumeResult = response.data;
      setParsedPreview(data);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to parse resume. Please try again.';
      setError(String(detail));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!parsedPreview) return;
    onParsed(parsedPreview);
    toast.success('Resume parsed! Profile fields have been pre-filled.', {
      description: 'Review the details below and click Save Changes when ready.',
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-resume-parser-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-2xl z-10 transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!parsedPreview ? (
          <div>
            {/* Header with AI Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                AI Powered
              </span>
            </div>

            <h2 id="ai-resume-parser-title" className="text-xl sm:text-2xl font-bold text-zinc-950">
              AI Resume Auto-Fill
            </h2>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
              Upload your PDF resume. Our AI automatically extracts your bio, skills, work history,
              education, and projects so you don&apos;t have to type them manually.
            </p>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-sm text-red-800">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1 text-xs sm:text-sm">{error}</div>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-violet-500 bg-violet-50/50 scale-[1.01]'
                  : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-50 hover:border-zinc-300'
              } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mb-3 shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{file.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                  </p>
                  <span className="mt-3 text-xs text-violet-600 font-medium hover:underline">
                    Click to choose a different PDF
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 mb-3 group-hover:scale-105 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Click to upload or drag &amp; drop
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">PDF resumes only (maximum 10MB)</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={!file || isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-violet-300" />
                    <span>Parse with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Loading step indicator */}
            {isLoading && (
              <div className="mt-4 flex items-center gap-2.5 text-xs text-zinc-500 justify-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
                <span>{loadingStep}</span>
              </div>
            )}
          </div>
        ) : (
          /* Parsed Summary Preview */
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Parsing Complete
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950">
              Resume Analysis Ready!
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Here is a summary of what AI extracted from your resume:
            </p>

            <div className="mt-5 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
              {(parsedPreview.parsed_data.first_name || parsedPreview.parsed_data.last_name) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200/60">
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Candidate Name
                    </span>
                    <p className="text-sm font-bold text-zinc-950 mt-0.5">
                      {[parsedPreview.parsed_data.first_name, parsedPreview.parsed_data.last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  </div>
                  {(parsedPreview.parsed_data.address || parsedPreview.parsed_data.location) && (
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Location / Address
                      </span>
                      <p className="text-xs font-medium text-zinc-700 mt-0.5">
                        {parsedPreview.parsed_data.address || parsedPreview.parsed_data.location}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {parsedPreview.parsed_data.headline && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Headline
                  </span>
                  <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                    {parsedPreview.parsed_data.headline}
                  </p>
                </div>
              )}

              {parsedPreview.parsed_data.linkedin_url && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    LinkedIn
                  </span>
                  <p className="text-xs text-blue-600 truncate mt-0.5">
                    {parsedPreview.parsed_data.linkedin_url}
                  </p>
                </div>
              )}

              {parsedPreview.parsed_data.skills && parsedPreview.parsed_data.skills.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Skills ({parsedPreview.parsed_data.skills.length} extracted)
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {parsedPreview.parsed_data.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded-md bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 border border-zinc-200 shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {parsedPreview.parsed_data.skills.length > 10 && (
                      <span className="text-xs text-zinc-500 self-center">
                        +{parsedPreview.parsed_data.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60">
                <div className="rounded-xl bg-white p-3 border border-zinc-100">
                  <span className="text-xs text-zinc-500">Experience</span>
                  <p className="text-base font-bold text-zinc-900 mt-0.5">
                    {parsedPreview.parsed_data.experience?.length || 0} entries
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-zinc-100">
                  <span className="text-xs text-zinc-500">Education</span>
                  <p className="text-base font-bold text-zinc-900 mt-0.5">
                    {parsedPreview.parsed_data.education?.length || 0} entries
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-zinc-100">
                  <span className="text-xs text-zinc-500">Projects</span>
                  <p className="text-base font-bold text-zinc-900 mt-0.5">
                    {parsedPreview.parsed_data.projects?.length || 0} entries
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-zinc-100">
                  <span className="text-xs text-zinc-500">Languages</span>
                  <p className="text-base font-bold text-zinc-900 mt-0.5">
                    {parsedPreview.parsed_data.languages?.length || 0} entries
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setParsedPreview(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition"
              >
                Re-upload
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 transition"
              >
                <span>Apply to Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
