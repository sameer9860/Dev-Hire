'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMe } from '@/hooks/useAuth';
import {
  useDirectMessages,
  useSendDirectMessage,
  useMarkMessagesRead,
} from '@/hooks/useMessages';
import { UserAvatar } from '@/components/UserAvatar';
import type { DirectMessage } from '@/types/api';
import {
  MessageSquare,
  Send,
  Loader2,
  Inbox,
  ChevronLeft,
  Circle,
} from 'lucide-react';

/**
 * Thread = a unique conversation partner (grouped by sender/recipient).
 */
interface Thread {
  userId: number;
  username: string;
  avatarUrl?: string;
  role?: string;
  lastMessage: string;
  lastDate: string;
  unreadCount: number;
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function MessagePanel() {
  const { data: me } = useMe();
  const { data: messagesData, isLoading } = useDirectMessages();
  const sendMessageMutation = useSendDirectMessage();
  const markReadMutation = useMarkMessagesRead();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const allMessages = messagesData?.results ?? [];

  // Build thread list: group messages by the "other" user
  const threads = useMemo<Thread[]>(() => {
    if (!me) return [];
    const threadMap = new Map<number, Thread>();

    allMessages.forEach((msg: DirectMessage) => {
      const isMyMsg = msg.sender === me.id;
      const otherUserId = isMyMsg ? msg.recipient : msg.sender;
      const otherDetail = isMyMsg ? msg.recipient_detail : msg.sender_detail;

      if (!otherUserId) return;

      const existing = threadMap.get(otherUserId);
      if (!existing) {
        threadMap.set(otherUserId, {
          userId: otherUserId,
          username: otherDetail?.username || `User #${otherUserId}`,
          avatarUrl: otherDetail?.avatar_url,
          role: otherDetail?.role,
          lastMessage: msg.body,
          lastDate: msg.created_at,
          unreadCount: !isMyMsg && !msg.is_read ? 1 : 0,
        });
      } else {
        // Keep latest message
        if (new Date(msg.created_at) > new Date(existing.lastDate)) {
          existing.lastMessage = msg.body;
          existing.lastDate = msg.created_at;
        }
        if (!isMyMsg && !msg.is_read) {
          existing.unreadCount += 1;
        }
      }
    });

    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );
  }, [allMessages, me]);

  // Messages in the selected conversation
  const conversationMessages = useMemo(() => {
    if (!me || selectedUserId === null) return [];
    return allMessages
      .filter(
        (msg: DirectMessage) =>
          (msg.sender === me.id && msg.recipient === selectedUserId) ||
          (msg.sender === selectedUserId && msg.recipient === me.id)
      )
      .sort(
        (a: DirectMessage, b: DirectMessage) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }, [allMessages, me, selectedUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  // Mark messages as read when opening a thread
  useEffect(() => {
    if (selectedUserId !== null) {
      const hasUnread = conversationMessages.some(
        (m: DirectMessage) => m.recipient === me?.id && !m.is_read
      );
      if (hasUnread) {
        markReadMutation.mutate();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || selectedUserId === null) return;

    sendMessageMutation.mutate(
      {
        recipient_id: selectedUserId,
        body: messageBody.trim(),
      },
      {
        onSuccess: () => setMessageBody(''),
      }
    );
  };

  const selectedThread = threads.find((t) => t.userId === selectedUserId);
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        {selectedUserId !== null ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedUserId(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <UserAvatar
              src={selectedThread?.avatarUrl}
              name={selectedThread?.username || 'User'}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {selectedThread?.username}
              </p>
              {selectedThread?.role && (
                <span className="inline-flex items-center rounded-md border border-zinc-200/40 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-zinc-600">
                  {selectedThread.role}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-zinc-500" />
            <h2 className="text-base font-bold text-zinc-900">Messages</h2>
            {totalUnread > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[10px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {selectedUserId === null ? (
        /* ─── Thread List ─── */
        <div className="max-h-[480px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                No messages yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-zinc-500">
                When admins or other users message you, conversations will appear here.
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.userId}
                onClick={() => setSelectedUserId(thread.userId)}
                className="flex w-full items-start gap-3 border-b border-zinc-50 px-5 py-3.5 text-left transition hover:bg-zinc-50/80"
              >
                <UserAvatar
                  src={thread.avatarUrl}
                  name={thread.username}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {thread.username}
                      </p>
                      {thread.role && (
                        <span className="shrink-0 inline-flex items-center rounded-md border border-zinc-200/40 bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-zinc-500">
                          {thread.role}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-400">
                      {formatRelativeTime(thread.lastDate)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-zinc-500">
                      {thread.lastMessage}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-zinc-950 px-1 text-[10px] font-bold text-white">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        /* ─── Conversation View ─── */
        <div className="flex flex-col" style={{ height: '440px' }}>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
          >
            {conversationMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-zinc-400">
                  No messages in this conversation yet.
                </p>
              </div>
            ) : (
              conversationMessages.map((msg: DirectMessage, idx: number) => {
                const isMe = msg.sender === me?.id;
                // Show date separator
                const prevMsg = idx > 0 ? conversationMessages[idx - 1] : null;
                const showDate =
                  !prevMsg ||
                  formatDate(msg.created_at) !==
                    formatDate(prevMsg.created_at);

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex items-center justify-center py-2">
                        <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-[10px] font-medium text-zinc-500">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                          isMe
                            ? 'bg-zinc-950 text-white'
                            : 'bg-zinc-100 text-zinc-900'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>
                        <div
                          className={`mt-0.5 flex items-center gap-1 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              isMe ? 'text-zinc-400' : 'text-zinc-400'
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </span>
                          {isMe && msg.is_read && (
                            <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Compose bar */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-zinc-100 px-4 py-3"
          >
            <input
              type="text"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Type a message…"
              className="h-10 flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-950/5"
            />
            <button
              type="submit"
              disabled={
                !messageBody.trim() || sendMessageMutation.isPending
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
