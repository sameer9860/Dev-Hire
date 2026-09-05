'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMe } from '@/hooks/useAuth';
import {
  useDirectMessages,
  useSendDirectMessage,
  useMarkMessagesRead,
  useMessageableUsers,
} from '@/hooks/useMessages';
import { UserAvatar } from '@/components/UserAvatar';
import type { DirectMessage, User } from '@/types/api';
import {
  MessageSquare,
  Send,
  Loader2,
  Inbox,
  Search,
  Plus,
  ArrowLeft,
  Circle,
  X,
} from 'lucide-react';

/* ─── Helpers ─── */
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
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface Thread {
  userId: number;
  username: string;
  avatarUrl?: string;
  role?: string;
  lastMessage: string;
  lastDate: string;
  unreadCount: number;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  company: 'bg-blue-50 text-blue-700 border-blue-200',
  developer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function MessagesPage() {
  const { data: me } = useMe();
  const { data: messagesData, isLoading } = useDirectMessages();
  const sendMessageMutation = useSendDirectMessage();
  const markReadMutation = useMarkMessagesRead();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messageableData } = useMessageableUsers(userSearch || undefined);
  const messageableUsers = messageableData?.results ?? [];

  const allMessages = messagesData?.results ?? [];

  // Build thread list
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
        if (new Date(msg.created_at) > new Date(existing.lastDate)) {
          existing.lastMessage = msg.body;
          existing.lastDate = msg.created_at;
        }
        if (!isMyMsg && !msg.is_read) existing.unreadCount += 1;
      }
    });

    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );
  }, [allMessages, me]);

  // Conversation messages for selected user
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

  const selectedThread = threads.find((t) => t.userId === selectedUserId);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  // Mark as read when opening thread
  useEffect(() => {
    if (selectedUserId !== null) {
      const hasUnread = conversationMessages.some(
        (m: DirectMessage) => m.recipient === me?.id && !m.is_read
      );
      if (hasUnread) markReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || selectedUserId === null) return;
    sendMessageMutation.mutate(
      { recipient_id: selectedUserId, body: messageBody.trim() },
      { onSuccess: () => setMessageBody('') }
    );
  };

  const handleSelectNewUser = (user: User) => {
    setSelectedUserId(user.id);
    setShowNewMessage(false);
    setUserSearch('');
  };

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Communication
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
          Messages
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Send and receive direct messages with{' '}
          {me?.role === 'admin'
            ? 'developers and companies'
            : me?.role === 'company'
            ? 'developers and admins'
            : 'companies and admins'}
          .
        </p>
      </div>

      {/* Main messaging layout */}
      <div className="grid h-[calc(100vh-260px)] min-h-[500px] grid-cols-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_2px_15px_rgba(0,0,0,0.02)] lg:grid-cols-12">
        {/* ─── Left: Thread List ─── */}
        <div className="flex flex-col border-r border-zinc-100 lg:col-span-4">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">Conversations</h2>
              {totalUnread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[10px] font-bold text-white">
                  {totalUnread}
                </span>
              )}
            </div>
            {me?.role !== 'developer' && (
              <button
                onClick={() => setShowNewMessage(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800"
                title="New message"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* New message user search overlay */}
          {showNewMessage && (
            <div className="border-b border-zinc-100 bg-zinc-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600">New Message To:</span>
                <button
                  onClick={() => { setShowNewMessage(false); setUserSearch(''); }}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  autoFocus
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-950/5"
                />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
                {messageableUsers.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-400">No users found</p>
                ) : (
                  messageableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectNewUser(u)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-zinc-100"
                    >
                      <UserAvatar src={u.avatar_url} name={u.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">{u.username}</p>
                        <p className="truncate text-[11px] text-zinc-500">{u.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold capitalize ${ROLE_COLORS[u.role] || 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                        {u.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-900">No conversations yet</p>
                <p className="mt-1 max-w-[200px] text-xs text-zinc-500">
                  Click the + button to start a new conversation.
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = thread.userId === selectedUserId;
                return (
                  <button
                    key={thread.userId}
                    onClick={() => { setSelectedUserId(thread.userId); setShowNewMessage(false); }}
                    className={`flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-3.5 text-left transition ${
                      isActive
                        ? 'bg-zinc-950 text-white'
                        : 'hover:bg-zinc-50/80'
                    }`}
                  >
                    <UserAvatar src={thread.avatarUrl} name={thread.username} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`truncate text-sm font-semibold ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                            {thread.username}
                          </p>
                          {thread.role && (
                            <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold capitalize ${
                              isActive
                                ? 'border-zinc-700 bg-zinc-800 text-zinc-300'
                                : ROLE_COLORS[thread.role] || 'bg-zinc-50 text-zinc-600 border-zinc-200'
                            }`}>
                              {thread.role}
                            </span>
                          )}
                        </div>
                        <span className={`shrink-0 text-[11px] ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
                          {formatRelativeTime(thread.lastDate)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className={`truncate text-xs ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {thread.lastMessage}
                        </p>
                        {thread.unreadCount > 0 && !isActive && (
                          <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-zinc-950 px-1 text-[10px] font-bold text-white">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Right: Conversation ─── */}
        <div className="flex flex-col lg:col-span-8">
          {selectedUserId === null ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Select a conversation</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Choose an existing conversation from the left, or start a new one with the + button.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3.5">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <UserAvatar
                  src={selectedThread?.avatarUrl}
                  name={selectedThread?.username || 'User'}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-900">
                    {selectedThread?.username}
                  </p>
                  {selectedThread?.role && (
                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${ROLE_COLORS[selectedThread.role] || 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                      {selectedThread.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Message bubbles */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                {conversationMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-zinc-400">Start the conversation by sending a message below.</p>
                  </div>
                ) : (
                  conversationMessages.map((msg: DirectMessage, idx: number) => {
                    const isMe = msg.sender === me?.id;
                    const prevMsg = idx > 0 ? conversationMessages[idx - 1] : null;
                    const showDate =
                      !prevMsg || formatDate(msg.created_at) !== formatDate(prevMsg.created_at);

                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex items-center justify-center py-3">
                            <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-[10px] font-medium text-zinc-500">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? 'bg-zinc-950 text-white'
                                : 'bg-zinc-100 text-zinc-900'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.body}
                            </p>
                            <div className={`mt-0.5 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[10px] ${isMe ? 'text-zinc-400' : 'text-zinc-400'}`}>
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

              {/* Compose */}
              {me?.role === 'developer' ? (
                <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-3.5 text-center text-xs font-medium text-zinc-500">
                  Developers can receive and view messages from Companies and Admins. Sending direct messages is disabled. Need help? Use{' '}
                  <a href="/contact" className="font-semibold text-zinc-900 underline hover:text-zinc-700">
                    Contact Us
                  </a>
                  .
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-2.5 border-t border-zinc-100 px-5 py-3.5">
                  <input
                    type="text"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type a message…"
                    className="h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-950/5"
                  />
                  <button
                    type="submit"
                    disabled={!messageBody.trim() || sendMessageMutation.isPending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
