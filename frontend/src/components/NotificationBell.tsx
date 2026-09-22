'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Briefcase, MessageSquare, Shield, UserPlus, FileText } from 'lucide-react';
import { useMe } from '@/hooks/useAuth';
import { useActivityLog, useMarkActivityRead } from '@/hooks/useActivity';
import { UserAvatar } from '@/components/UserAvatar';
import type { ActivityLog } from '@/types/api';

function displayName(username?: string) {
  if (!username) return 'there';
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function metaString(item: ActivityLog, key: string): string | undefined {
  const value = item.metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function metaNumber(item: ActivityLog, key: string): number | undefined {
  const value = item.metadata?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

/** Role-aware deep link for a notification row */
function notificationHref(item: ActivityLog, role?: string): string | null {
  const applicationId = metaNumber(item, 'application_id');
  const jobId = metaNumber(item, 'job_id');

  if (role === 'company') {
    if (item.action === 'candidate_applied' || item.action === 'application_status_updated') {
      if (applicationId) return `/dashboard/company/applications/${applicationId}`;
      if (jobId) return `/dashboard/company/applications?job=${jobId}`;
      return '/dashboard/company/applications';
    }
    if (item.action === 'direct_message_received') return '/dashboard/messages';
    if (item.category === 'support') return '/dashboard/company';
    return null;
  }

  if (role === 'developer') {
    if (item.category === 'application') {
      if (jobId) return `/jobs/${jobId}`;
      return '/applications';
    }
    if (item.category === 'bookmark') return '/bookmarks';
    if (item.action === 'direct_message_received') return '/dashboard/messages';
    return null;
  }

  if (item.action === 'direct_message_received') return '/dashboard/messages';
  return null;
}

function notificationSubtitle(item: ActivityLog, role?: string, username?: string): string {
  const developerName = metaString(item, 'developer_name');
  const jobTitle = metaString(item, 'job_title');
  const companyName = metaString(item, 'company_name');
  const status = metaString(item, 'status');

  if (role === 'company') {
    if (item.action === 'candidate_applied') {
      return [developerName && `Candidate · ${developerName}`, jobTitle].filter(Boolean).join(' · ') || 'New applicant';
    }
    if (item.action === 'application_status_updated') {
      return [jobTitle, status && `Status · ${status}`].filter(Boolean).join(' · ') || 'Pipeline update';
    }
    if (item.action === 'direct_message_received') return 'Direct message';
    if (item.category === 'security') return 'Account security';
    if (item.category === 'support') return 'Support';
    if (item.category === 'profile') return 'Company profile';
    return item.category;
  }

  if (role === 'developer') {
    if (item.category === 'application') {
      return [companyName || jobTitle, status && `Status · ${status}`].filter(Boolean).join(' · ') || 'Application';
    }
    if (item.category === 'bookmark') return 'Saved jobs';
    if (item.action === 'direct_message_received') return 'Direct message';
    return item.category;
  }

  return displayName(username);
}

function CategoryIcon({ item }: { item: ActivityLog }) {
  const className = 'h-4 w-4 text-zinc-600';
  if (item.action === 'candidate_applied') return <UserPlus className={className} />;
  if (item.action === 'direct_message_received') return <MessageSquare className={className} />;
  if (item.category === 'security') return <Shield className={className} />;
  if (item.category === 'application') return <FileText className={className} />;
  if (item.category === 'bookmark') return <Briefcase className={className} />;
  return <Bell className={className} />;
}

const EMPTY_COPY: Record<string, { title: string; body: string }> = {
  company: {
    title: 'No hiring alerts yet',
    body: 'New applicants, pipeline updates, and messages about your jobs will show here.',
  },
  developer: {
    title: 'No notifications yet',
    body: 'Application status updates, saved jobs, and messages will show here.',
  },
  default: {
    title: 'No notifications yet',
    body: 'Account alerts and messages will show here.',
  },
};

type PrefKey =
  | 'all_notifications'
  | 'new_applicants'
  | 'pipeline_updates'
  | 'messages'
  | 'account_alerts'
  | 'new_internship'
  | 'preferred_internship'
  | 'preferred_job';

function readNotificationPrefs(): Record<PrefKey, boolean> {
  const defaults: Record<PrefKey, boolean> = {
    all_notifications: true,
    new_applicants: true,
    pipeline_updates: true,
    messages: true,
    account_alerts: true,
    new_internship: true,
    preferred_internship: true,
    preferred_job: true,
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem('notification_settings');
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function isAllowedByPrefs(item: ActivityLog, role: string | undefined, prefs: Record<PrefKey, boolean>) {
  if (!prefs.all_notifications) return false;
  if (role !== 'company') return true;

  if (item.action === 'candidate_applied') return prefs.new_applicants;
  if (item.action === 'application_status_updated') return prefs.pipeline_updates;
  if (item.action === 'direct_message_received') return prefs.messages;
  if (item.category === 'security' || item.category === 'support' || item.category === 'profile') {
    return prefs.account_alerts;
  }
  return true;
}

export function NotificationBell() {
  const { data: user } = useMe();
  const { data: activityData, isLoading } = useActivityLog();
  const markRead = useMarkActivityRead();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(readNotificationPrefs);

  useEffect(() => {
    const sync = () => setPrefs(readNotificationPrefs());
    window.addEventListener('storage', sync);
    // Re-read when opening the panel in case settings changed in this tab
    if (open) sync();
    return () => window.removeEventListener('storage', sync);
  }, [open]);

  const role = user?.role;
  const notifications = useMemo(() => {
    const items = (activityData?.results ?? []).filter((item) => isAllowedByPrefs(item, role, prefs));
    if (role === 'company') {
      const hiringFirst = [...items].sort((a, b) => {
        const rank = (item: ActivityLog) => {
          if (item.action === 'candidate_applied') return 0;
          if (item.action === 'application_status_updated') return 1;
          if (item.action === 'direct_message_received') return 2;
          if (item.category === 'application') return 3;
          if (item.category === 'security' || item.category === 'support') return 4;
          return 5;
        };
        const byRank = rank(a) - rank(b);
        if (byRank !== 0) return byRank;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      return hiringFirst.slice(0, 10);
    }
    return items.slice(0, 10);
  }, [activityData?.results, role, prefs]);

  const unreadCount = activityData?.unread_count ?? 0;
  const empty = EMPTY_COPY[role ?? ''] ?? EMPTY_COPY.default;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notification-bell]')) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" data-notification-bell>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-950 transition-colors hover:bg-zinc-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 fill-zinc-950" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {role === 'company' ? 'Hiring alerts' : 'Notifications'}
              </p>
              <p className="text-xs text-zinc-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => markRead.mutate()}
              disabled={unreadCount === 0 || markRead.isPending}
              className="cursor-pointer text-xs font-medium text-zinc-600 hover:text-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-zinc-900">{empty.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{empty.body}</p>
              </div>
            ) : (
              <ul>
                {notifications.map((item) => {
                  const href = notificationHref(item, role);
                  const subtitle = notificationSubtitle(item, role, user.username);
                  const developerName = metaString(item, 'developer_name');
                  const showApplicantAvatar =
                    role === 'company' &&
                    (item.action === 'candidate_applied' || item.action === 'application_status_updated');

                  const row = (
                    <div
                      className={[
                        'flex gap-3 px-4 py-3',
                        item.is_read ? 'bg-white' : 'bg-zinc-50',
                        href ? 'transition hover:bg-zinc-100/80' : '',
                      ].join(' ')}
                    >
                      {showApplicantAvatar ? (
                        <UserAvatar src={undefined} name={developerName || 'Candidate'} size="md" />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                          <CategoryIcon item={item} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug text-zinc-900">{item.message}</p>
                          <time className="shrink-0 pt-0.5 text-[11px] text-zinc-400">
                            {formatRelativeTime(item.created_at)}
                          </time>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">{subtitle}</p>
                      </div>
                    </div>
                  );

                  return (
                    <li key={item.id} className="border-b border-zinc-100 last:border-0">
                      {href ? (
                        <Link href={href} onClick={() => setOpen(false)}>
                          {row}
                        </Link>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {role === 'company' && (
            <div className="border-t border-zinc-100 px-4 py-2.5">
              <Link
                href="/dashboard/company/applications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-zinc-700 hover:text-zinc-950"
              >
                View all candidates →
              </Link>
            </div>
          )}
          {role === 'developer' && (
            <div className="border-t border-zinc-100 px-4 py-2.5">
              <Link
                href="/applications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-zinc-700 hover:text-zinc-950"
              >
                View applications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
