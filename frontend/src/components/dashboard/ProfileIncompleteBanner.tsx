'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types/api';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MissingField {
  label: string;
  isFilled: boolean;
}

export function getProfileCompletionInfo(user: User | null | undefined) {
  if (!user) {
    return { isComplete: true, percentage: 100, missingFields: [] };
  }

  const fields: MissingField[] = [];

  if (user.role === 'company') {
    fields.push({ label: 'Company Logo', isFilled: Boolean(user.avatar_url) });
    fields.push({ label: 'Company Name', isFilled: Boolean(user.company_name) });
    fields.push({ label: 'Contact Person', isFilled: Boolean(user.contact_person) });
    fields.push({ label: 'About Company', isFilled: Boolean(user.bio) });
    fields.push({ label: 'Website', isFilled: Boolean(user.company_website) });
    fields.push({ label: 'Company Size', isFilled: Boolean(user.company_size) });
    fields.push({ label: 'Category & Founded Year', isFilled: Boolean(user.company_category || user.company_founded) });
    fields.push({ label: 'Province & District', isFilled: Boolean(user.company_province || user.company_district) });
    fields.push({ label: 'Company Location', isFilled: Boolean(user.company_location) });
    fields.push({ label: 'Company Address', isFilled: Boolean(user.company_address) });
    fields.push({ label: 'Company Photos', isFilled: Boolean(user.company_photos && user.company_photos.length > 0) });
    fields.push({ label: 'Company Social Links', isFilled: Boolean(user.company_social_links && user.company_social_links.length > 0) });
    fields.push({ label: 'Company Email', isFilled: Boolean(user.company_email) });
    fields.push({ label: 'Company Phone', isFilled: Boolean(user.company_phone) });
  } else if (user.role === 'developer') {
    fields.push({ label: 'About', isFilled: Boolean(user.first_name && user.last_name && user.gender && user.date_of_birth && user.bio && user.avatar_url) });
    fields.push({ label: 'Address & Links', isFilled: Boolean((user.address || user.current_address || user.city || user.province || user.location) && ((user.social_links && user.social_links.length > 0) || user.github_url || user.portfolio_url)) });
    fields.push({ label: 'Resume / CV', isFilled: Boolean(user.resume_url) });
    fields.push({ label: 'Education', isFilled: Boolean(user.education && user.education.length > 0) });
    fields.push({ label: 'Projects', isFilled: Boolean(user.projects && user.projects.length > 0) });
    fields.push({ label: 'Experience', isFilled: Boolean(user.experience && user.experience.length > 0) });
    fields.push({ label: 'Skills & Tech Stack', isFilled: Boolean(user.skills && user.skills.length > 0) });
    fields.push({ label: 'Achievements', isFilled: Boolean(user.achievements && user.achievements.length > 0) });
    fields.push({ label: 'Training', isFilled: Boolean(user.training && user.training.length > 0) });
    fields.push({ label: 'Languages', isFilled: Boolean(user.languages && user.languages.length > 0) });
    fields.push({ label: 'Email & Phone', isFilled: Boolean(user.email && user.phone_number) });
  }

  if (fields.length === 0) {
    return { isComplete: true, percentage: 100, missingFields: [] };
  }

  const filledCount = fields.filter((f) => f.isFilled).length;
  const percentage = Math.round((filledCount / fields.length) * 100);
  const missingFields = fields.filter((f) => !f.isFilled).map((f) => f.label);
  const isComplete = percentage === 100;

  return { isComplete, percentage, missingFields };
}

export function ProfileIncompleteBanner({ user }: { user: User | null | undefined }) {
  const { isComplete, percentage, missingFields } = getProfileCompletionInfo(user);

  if (isComplete || !user) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/40 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100/90 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-amber-950">
                Your profile is incomplete ({percentage}% complete)
              </h3>
              <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Action required
              </span>
            </div>
            <p className="mt-1 text-sm text-amber-800">
              {user.role === 'company'
                ? 'Complete your company profile to post jobs and build trust with top candidates.'
                : 'A complete profile gets up to 4x more employer views and job matches.'}
            </p>

            {/* Progress bar */}
            <div className="mt-3 max-w-md">
              <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200/60">
                <div
                  className="h-full bg-amber-600 transition-all duration-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Missing field badges */}
            {missingFields.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-amber-900">Missing:</span>
                {missingFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center rounded-md border border-amber-300/70 bg-amber-100/70 px-2 py-0.5 font-medium text-amber-900"
                  >
                    + {field}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link href="/profile" className="shrink-0 self-start md:self-center">
          <button className="inline-flex items-center gap-2 rounded-xl bg-amber-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-950 focus:ring-offset-2">
            Complete Profile
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
