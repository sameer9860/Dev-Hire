'use client';

import React, { useState } from 'react';
import {
  useAdminStats,
  useAdminUsers,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useAdminJobs,
  useUpdateAdminJob,
  useDeleteAdminJob,
  useAdminContactMessages,
  useUpdateAdminContactMessage,
} from '@/hooks/useAdmin';
import {
  useDirectMessages,
  useSendDirectMessage,
  useMarkMessagesRead,
} from '@/hooks/useMessages';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Users,
  Briefcase,
  MessageSquare,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Send,
  Eye,
  FileText,
  Building,
  UserCheck,
  Ban,
  Shield,
  Clock,
  Filter,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'contact' | 'messages'>('overview');

  // Stats Query
  const { data: stats, isLoading: isLoadingStats } = useAdminStats();

  // User Management Query & Mutations
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const { data: usersData, isLoading: isLoadingUsers } = useAdminUsers({
    search: userSearch,
    role: userRoleFilter,
  });
  const updateUserMutation = useUpdateAdminUser();
  const deleteUserMutation = useDeleteAdminUser();

  // Job Management Query & Mutations
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const { data: jobsData, isLoading: isLoadingJobs } = useAdminJobs({
    search: jobSearch,
    is_active: jobStatusFilter,
  });
  const updateJobMutation = useUpdateAdminJob();
  const deleteJobMutation = useDeleteAdminJob();

  // Contact Messages Query & Mutation
  const [contactCategoryFilter, setContactCategoryFilter] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState('');
  const { data: contactData, isLoading: isLoadingContact } = useAdminContactMessages({
    category: contactCategoryFilter,
    status: contactStatusFilter,
  });
  const updateContactMutation = useUpdateAdminContactMessage();
  const [replyMessageState, setReplyMessageState] = useState<Record<number, string>>({});

  // Direct Messages Query & Mutation
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  const { data: messagesData, isLoading: isLoadingMessages } = useDirectMessages(selectedRecipientId || undefined);
  const sendMessageMutation = useSendDirectMessage();
  const [messageBody, setMessageBody] = useState('');
  const [messageSubject, setMessageSubject] = useState('');

  const usersList = usersData?.results ?? [];
  const jobsList = jobsData?.results ?? [];
  const contactList = contactData?.results ?? [];
  const messageList = messagesData?.results ?? [];

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) return;

    sendMessageMutation.mutate(
      {
        recipient_id: selectedRecipientId || undefined,
        subject: messageSubject.trim(),
        body: messageBody.trim(),
      },
      {
        onSuccess: () => {
          setMessageBody('');
          setMessageSubject('');
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              <Shield className="h-3.5 w-3.5" />
              Platform Administrator
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
            Control Center & Moderation
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage users, moderate job postings, inspect contact inquiries, and message developers & companies.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        {[
          { id: 'overview', label: 'Overview', icon: Sparkles },
          { id: 'users', label: 'User Management', icon: Users, badge: stats?.total_users },
          { id: 'jobs', label: 'Job Listings', icon: Briefcase, badge: stats?.total_jobs },
          { id: 'contact', label: 'Contact Submissions', icon: Mail, badge: stats?.pending_contact_messages },
          { id: 'messages', label: 'Direct Messages', icon: MessageSquare, badge: stats?.unread_direct_messages },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW STATS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">Total Users</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900">
                {isLoadingStats ? '—' : stats?.total_users}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {stats?.total_developers} Developers · {stats?.total_companies} Companies
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">Job Postings</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900">
                {isLoadingStats ? '—' : stats?.total_jobs}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {stats?.active_jobs} Active · {stats?.closed_jobs} Closed
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">Applications</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-700">
                  <FileText className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900">
                {isLoadingStats ? '—' : stats?.total_applications}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {stats?.accepted_applications} Accepted candidates
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">Contact Messages</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
                  <Mail className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900">
                {isLoadingStats ? '—' : stats?.total_contact_messages}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {stats?.pending_contact_messages} Pending review
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <h2 className="text-base font-bold text-zinc-900">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Manage Users</p>
                    <p className="text-xs text-zinc-500">Review developers & companies</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('contact')}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Contact Submissions</p>
                    <p className="text-xs text-zinc-500">Read & reply to user inquiries</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('jobs')}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Moderate Jobs</p>
                    <p className="text-xs text-zinc-500">Toggle or remove job posts</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('messages')}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Direct Messages</p>
                    <p className="text-xs text-zinc-500">Send message to user</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <h2 className="text-base font-bold text-zinc-900">System Information</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-xs font-semibold text-zinc-500 uppercase">Platform Status</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-xs font-semibold text-zinc-500 uppercase">Database & API</span>
                  <span className="text-xs font-semibold text-zinc-800">Connected (PostgreSQL / REST)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-xs font-semibold text-zinc-500 uppercase">Cache & Session</span>
                  <span className="text-xs font-semibold text-zinc-800">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by username, email, or company..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="developer">Developers</option>
                  <option value="company">Companies</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            {isLoadingUsers ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-900" />
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-sm font-medium text-zinc-500">
                No users match your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Joined</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar src={user.avatar_url} name={user.username} size="md" />
                            <div>
                              <p className="font-bold text-zinc-900">
                                {user.username}{' '}
                                {user.role === 'company' && user.company_name && (
                                  <span className="font-normal text-zinc-500">({user.company_name})</span>
                                )}
                              </p>
                              <p className="text-xs text-zinc-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              user.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : user.role === 'company'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              user.is_active ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.is_active ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            {user.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500">
                          {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                updateUserMutation.mutate({ id: user.id, is_active: !user.is_active })
                              }
                              disabled={updateUserMutation.isPending}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                                user.is_active
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {user.is_active ? 'Disable' : 'Enable'}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedRecipientId(user.id);
                                setActiveTab('messages');
                              }}
                              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                            >
                              Message
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: JOB LISTINGS */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by job title, company, or location..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
                />
              </div>

              <select
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Closed Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {isLoadingJobs ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-900" />
              </div>
            ) : jobsList.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm font-medium text-zinc-500">
                No job listings found.
              </div>
            ) : (
              jobsList.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-900">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.title}
                        </Link>
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {job.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">
                        {typeof job.company === 'object' ? (job.company.company_name || job.company.username) : 'Company'}
                      </span>
                      <span>·</span>
                      <span>{job.location}</span>
                      <span>·</span>
                      <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                      <span>·</span>
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        updateJobMutation.mutate({ id: job.id, is_active: !job.is_active })
                      }
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        job.is_active
                          ? 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {job.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete job posting "${job.title}"?`)) {
                          deleteJobMutation.mutate(job.id);
                        }
                      }}
                      className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                      title="Delete job posting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT SUBMISSIONS */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-zinc-900">
                Contact Messages ({contactList.length})
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={contactCategoryFilter}
                  onChange={(e) => setContactCategoryFilter(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="bug">Bug Reports</option>
                  <option value="query">Queries</option>
                  <option value="others">Others</option>
                </select>

                <select
                  value={contactStatusFilter}
                  onChange={(e) => setContactStatusFilter(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isLoadingContact ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-900" />
              </div>
            ) : contactList.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm font-medium text-zinc-500">
                No contact submissions found.
              </div>
            ) : (
              contactList.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                          {msg.category}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900">{msg.subject}</h3>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        From: <span className="font-semibold text-zinc-700">{msg.name}</span> ({msg.email}) ·{' '}
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>

                    <select
                      value={msg.status}
                      onChange={(e) =>
                        updateContactMutation.mutate({ id: msg.id, status: e.target.value })
                      }
                      className={`h-8 rounded-xl border px-3 text-xs font-semibold outline-none ${
                        msg.status === 'resolved'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : msg.status === 'in_progress'
                          ? 'border-blue-200 bg-blue-50 text-blue-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                    {msg.description}
                  </div>

                  {msg.attachment_url && (
                    <div>
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 underline hover:text-zinc-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Attached File
                      </a>
                    </div>
                  )}

                  {/* Admin Reply Form */}
                  <div className="border-t border-zinc-100 pt-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reply directly to user..."
                        value={replyMessageState[msg.id] || ''}
                        onChange={(e) =>
                          setReplyMessageState((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                      />
                      <button
                        onClick={() => {
                          const replyText = replyMessageState[msg.id];
                          if (!replyText) return;
                          updateContactMutation.mutate(
                            { id: msg.id, reply: replyText, status: 'resolved' },
                            {
                              onSuccess: () => {
                                setReplyMessageState((prev) => ({ ...prev, [msg.id]: '' }));
                              },
                            }
                          );
                        }}
                        disabled={updateContactMutation.isPending}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl bg-zinc-950 px-3 text-xs font-semibold text-white hover:bg-zinc-800"
                      >
                        <Send className="h-3.5 w-3.5" /> Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DIRECT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* User selector column */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <h2 className="mb-3 text-base font-bold text-zinc-900">Select Conversation User</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                <button
                  onClick={() => setSelectedRecipientId(null)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedRecipientId === null
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <p className="font-semibold text-sm">All Recent Messages</p>
                  <p className="text-xs opacity-75">View inbox trajectory</p>
                </button>

                {usersList.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedRecipientId(u.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedRecipientId === u.id
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar src={u.avatar_url} name={u.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs truncate">{u.username}</p>
                        <p className="text-[11px] opacity-75 capitalize">{u.role}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages conversation column */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col min-h-[500px]">
              <h2 className="mb-4 border-b border-zinc-100 pb-3 text-base font-bold text-zinc-900">
                Messages Thread
              </h2>

              <div className="flex-1 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {isLoadingMessages ? (
                  <div className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-900" />
                  </div>
                ) : messageList.length === 0 ? (
                  <div className="py-12 text-center text-sm font-medium text-zinc-500">
                    No message history with this user. Send a message below!
                  </div>
                ) : (
                  messageList.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm ${
                        msg.sender_detail?.role === 'admin' || msg.sender_detail?.is_staff
                          ? 'ml-auto bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-xs opacity-75 mb-1">
                        <span className="font-semibold">
                          {msg.sender_detail?.username || 'User'}
                        </span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {msg.subject && <p className="font-bold text-xs mb-1 underline">{msg.subject}</p>}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Send message box */}
              <form onSubmit={handleSendDirectMessage} className="mt-4 border-t border-zinc-100 pt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Subject (optional)..."
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                />
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Type your message to user..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 outline-none focus:border-zinc-400 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending}
                    className="inline-flex h-auto items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 shrink-0"
                  >
                    <Send className="h-4 w-4" /> Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
