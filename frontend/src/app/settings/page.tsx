'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  useMe,
  useChangePassword,
  useDeleteAccount,
} from '@/hooks/useAuth';
import {
  createChangePasswordSchema,
  deleteAccountSchema,
  PASSWORD_RULES_HELP,
  type ChangePasswordFormData,
  type DeleteAccountFormData,
} from '@/schemas/authSchema';
import { Eye, EyeOff, KeyRound, ShieldAlert, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && !user) {
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
      if (!hasToken) router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  return <SettingsContent username={user.username} />;
}

function SettingsContent({ username }: { username: string }) {
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNew2, setShowNew2] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(createChangePasswordSchema(username)),
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password2: '',
    },
  });

  const deleteForm = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  const onChangePassword = passwordForm.handleSubmit((data) => {
    changePassword.mutate(data, {
      onSuccess: () => passwordForm.reset(),
    });
  });

  const onDeleteAccount = deleteForm.handleSubmit((data) => {
    deleteAccount.mutate(data);
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Settings</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Manage your password and account for{' '}
          <span className="font-semibold text-zinc-700">{username}</span>.
        </p>
      </div>

      <div className="space-y-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <KeyRound className="h-5 w-5 text-zinc-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Change password</h2>
              <p className="mt-0.5 text-sm text-zinc-500">{PASSWORD_RULES_HELP}</p>
            </div>
          </div>

          <form onSubmit={onChangePassword} className="space-y-4">
            <div>
              <label htmlFor="current_password" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Current password
              </label>
              <div className="relative">
                <input
                  id="current_password"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  {...passwordForm.register('current_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {passwordForm.formState.errors.current_password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new_password" className="mb-1.5 block text-sm font-medium text-zinc-700">
                New password
              </label>
              <div className="relative">
                <input
                  id="new_password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  {...passwordForm.register('new_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new_password2" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="new_password2"
                  type={showNew2 ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  {...passwordForm.register('new_password2')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew2((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  aria-label={showNew2 ? 'Hide password' : 'Show password'}
                >
                  {showNew2 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password2 && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {passwordForm.formState.errors.new_password2.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={changePassword.isPending}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
              <p className="mt-0.5 text-sm text-red-700/80">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
          </div>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          ) : (
            <form onSubmit={onDeleteAccount} className="space-y-4">
              <p className="text-sm font-medium text-red-800">
                Enter your password to confirm account deletion.
              </p>
              <div>
                <label htmlFor="delete_password" className="mb-1.5 block text-sm font-medium text-red-900">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="delete_password"
                    type={showDeletePassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-11 w-full rounded-xl border border-red-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/10"
                    {...deleteForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    aria-label={showDeletePassword ? 'Hide password' : 'Show password'}
                  >
                    {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {deleteForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {deleteForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={deleteAccount.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteAccount.isPending ? 'Deleting…' : 'Permanently delete'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    deleteForm.reset();
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
