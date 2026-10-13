'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Target, CheckCircle2, AlertCircle, PlusCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useJobMatch } from '@/hooks/useJobs';
import { useMe } from '@/hooks/useAuth';
import type { MatchScoreResult } from '@/types/api';

interface MatchScoreBadgeProps {
  jobId: number;
  initialMatch?: MatchScoreResult | null;
  size?: 'sm' | 'md';
  className?: string;
  disablePopover?: boolean;
}

export function MatchScoreBadge({
  jobId,
  initialMatch,
  size = 'md',
  className = '',
  disablePopover = false,
}: MatchScoreBadgeProps) {
  const { data: me } = useMe();
  const isDeveloper = me?.role === 'developer';

  // Only auto-fetch match score if logged in as a developer and no initialMatch passed
  const shouldFetch = isDeveloper && !initialMatch;
  const { data: fetchedMatch, isLoading } = useJobMatch(jobId, shouldFetch);

  const match = initialMatch || fetchedMatch;

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAllBonus, setShowAllBonus] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number; placeAbove?: boolean }>({
    top: 0,
    left: 0,
    width: 320,
    placeAbove: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute position relative to viewport so it never clips outside screen or inside overflow containers
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const margin = 12;
    const targetWidth = Math.min(330, window.innerWidth - margin * 2);

    // Prefer aligning right edge of popover with right edge of badge
    let left = rect.right - targetWidth;

    // If that would push the left edge past the left of screen, align with left edge
    if (left < margin) {
      left = Math.max(margin, rect.left);
    }
    // Also ensure right edge doesn't overflow
    if (left + targetWidth > window.innerWidth - margin) {
      left = window.innerWidth - margin - targetWidth;
    }

    const estimatedHeight = 360;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    const top = placeAbove ? rect.top - 8 : rect.bottom + 8;

    setPopoverPos({
      top,
      left,
      width: targetWidth,
      placeAbove,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    function handleScrollOrResize() {
      updatePosition();
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // If not a developer and no initialMatch (e.g. guest or company browsing jobs), don't show
  if (!isDeveloper && !initialMatch) {
    return null;
  }

  if (isLoading && !match) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 animate-pulse rounded-full border border-zinc-200 bg-zinc-100/70 whitespace-nowrap shrink-0 ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } font-medium text-zinc-400 select-none ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
        <span>Match...</span>
      </div>
    );
  }

  if (!match) {
    return null;
  }

  const { score, label, matching_skills = [], missing_skills = [], bonus_skills = [], ai_enhanced } = match;

  // Color schemes based on match score
  let badgeStyles = 'bg-zinc-100 text-zinc-700 border-zinc-200';
  let dotStyles = 'bg-zinc-400';
  let scoreColor = 'text-zinc-700';

  if (score >= 80) {
    badgeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70';
    dotStyles = 'bg-emerald-500';
    scoreColor = 'text-emerald-700';
  } else if (score >= 60) {
    badgeStyles = 'bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100/70';
    dotStyles = 'bg-blue-500';
    scoreColor = 'text-blue-700';
  } else if (score >= 40) {
    badgeStyles = 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70';
    dotStyles = 'bg-amber-500';
    scoreColor = 'text-amber-700';
  } else {
    badgeStyles = 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100/70';
    dotStyles = 'bg-rose-500';
    scoreColor = 'text-rose-700';
  }

  const handleToggle = (e: React.MouseEvent) => {
    if (disablePopover) return;
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  const visibleBonusSkills = showAllBonus ? bonus_skills : bonus_skills.slice(0, 10);
  const hasHiddenBonus = bonus_skills.length > 10;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        title="Click to view skill match breakdown"
        className={`group inline-flex items-center gap-1.5 rounded-full border transition-all duration-150 cursor-pointer shadow-2xs whitespace-nowrap shrink-0 leading-none select-none ${badgeStyles} ${
          size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        } font-semibold ${className}`}
      >
        <span className={`h-2 w-2 rounded-full ${dotStyles} animate-pulse shrink-0`} />
        {ai_enhanced ? (
          <Sparkles className="h-3 w-3 text-indigo-500 shrink-0" />
        ) : (
          <Target className="h-3 w-3 shrink-0" />
        )}
        <span>{score}% Match</span>
        {label && <span className="opacity-75 font-medium hidden sm:inline">· {label}</span>}
      </button>

      {/* Popover Breakdown Rendered via Portal to avoid overflow clipping */}
      {isOpen && !disablePopover && mounted && createPortal(
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: popoverPos.placeAbove ? 'auto' : `${popoverPos.top}px`,
            bottom: popoverPos.placeAbove ? `${window.innerHeight - popoverPos.top}px` : 'auto',
            left: `${popoverPos.left}px`,
            width: `${popoverPos.width}px`,
            zIndex: 9999,
          }}
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${scoreColor} ${badgeStyles}`}>
                {score}%
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  Skill Match Breakdown
                  {ai_enhanced && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
                      <Sparkles className="h-2.5 w-2.5" /> AI
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {label ? `${label} Compatibility` : 'Compatibility rating'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 text-xs transition cursor-pointer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Breakdown Content */}
          <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
            {/* Matching skills */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Matching Skills ({matching_skills.length})</span>
              </div>
              {matching_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {matching_skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 italic">No exact matching skills found</p>
              )}
            </div>

            {/* Missing skills */}
            {missing_skills.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 mb-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Missing Requirements ({missing_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {missing_skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus skills */}
            {bonus_skills.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Bonus Relevant Skills ({bonus_skills.length})</span>
                  </div>
                  {hasHiddenBonus && (
                    <button
                      type="button"
                      onClick={() => setShowAllBonus(!showAllBonus)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-0.5"
                    >
                      {showAllBonus ? (
                        <>Show less <ChevronUp className="h-2.5 w-2.5" /></>
                      ) : (
                        <>+{bonus_skills.length - 10} more <ChevronDown className="h-2.5 w-2.5" /></>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {visibleBonusSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-800 border border-indigo-200/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-3 border-t border-zinc-100 pt-2 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Powered by DevHire AI Engine</span>
            <span>{ai_enhanced ? 'Gemini Semantic Match' : 'Skill Tech Match'}</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
