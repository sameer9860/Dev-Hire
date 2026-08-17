'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useMe } from '@/hooks/useAuth';
import { useActivityLog, useMarkActivityRead } from '@/hooks/useActivity';
import { UserAvatar } from '@/components/UserAvatar';

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

export function NotificationBell() {
  const { data: user } = useMe();
  const { data: activityData, isLoading } = useActivityLog();
  const markRead = useMarkActivityRead();
  const [open, setOpen] = useState(false);

  const notifications = (activityData?.results ?? []).slice(0, 10);
  const unreadCount = activityData?.unread_count ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notification-bell]')) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  if (!user || user.role !== 'developer') return null;

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
              <p className="text-sm font-semibold text-zinc-900">Notifications</p>
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
                <p className="text-sm font-medium text-zinc-900">No notifications yet</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Activity from applications, bookmarks, and profile updates will show here.
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((item) => (
                  <li
                    key={item.id}
                    className={[
                      'flex gap-3 border-b border-zinc-100 px-4 py-3 last:border-0',
                      item.is_read ? 'bg-white' : 'bg-zinc-50',
                    ].join(' ')}
                  >
                    <UserAvatar
                      src={user.avatar_url}
                      name={user.username}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-zinc-900">
                          {item.message}
                        </p>
                        <time className="shrink-0 pt-0.5 text-[11px] text-zinc-400">
                          {formatRelativeTime(item.created_at)}
                        </time>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {displayName(user.username)}
                        {user.email ? ` · ${user.email}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
