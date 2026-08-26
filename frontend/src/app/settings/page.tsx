'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useMe,
  useChangePassword,
  useDeleteAccount,
  useChangeEmailRequest,
  useChangeEmailVerifyOTP,
  useChangeEmailConfirm,
} from '@/hooks/useAuth';
import {
  createChangePasswordSchema,
  deleteAccountSchema,
  PASSWORD_RULES_HELP,
  passwordCharsetField,
  type ChangePasswordFormData,
  type DeleteAccountFormData,
} from '@/schemas/authSchema';
import { Eye, EyeOff, KeyRound, ShieldAlert, Trash2, Bell } from 'lucide-react';

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
  const changeEmailRequest = useChangeEmailRequest();
  const changeEmailVerifyOTP = useChangeEmailVerifyOTP();
  const changeEmailConfirm = useChangeEmailConfirm();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNew2, setShowNew2] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    all_notifications: true,
    new_internship: true,
    preferred_internship: true,
    preferred_job: true,
  });
  const [emailChangeEmail, setEmailChangeEmail] = useState('');
  const [emailChangeOtp, setEmailChangeOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [emailChangeStage, setEmailChangeStage] = useState<'idle' | 'sent' | 'verified'>('idle');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('notification_settings');
      if (raw) {
        setNotificationSettings(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleNotificationSetting = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((current) => {
      const updated = { ...current, [key]: !current[key] };
      try {
        localStorage.setItem('notification_settings', JSON.stringify(updated));
        toast.success('Notification preference updated');
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

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

  const submitEmailChangeRequest = (e: FormEvent) => {
    e.preventDefault();
    if (!emailChangeEmail.trim()) {
      toast.error('Please enter a new email address.');
      return;
    }

    changeEmailRequest.mutate(
      { new_email: emailChangeEmail.trim() },
      {
        onSuccess: () => {
          setEmailChangeStage('sent');
          setEmailChangeOtp('');
          setVerificationToken('');
        },
      },
    );
  };

  const verifyEmailCode = () => {
    if (!emailChangeEmail.trim() || !emailChangeOtp.trim()) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    changeEmailVerifyOTP.mutate(
      { new_email: emailChangeEmail.trim(), otp: emailChangeOtp.trim() },
      {
        onSuccess: (data) => {
          setVerificationToken(data.verification_token);
          setEmailChangeStage('verified');
        },
      },
    );
  };

  const confirmEmailChange = () => {
    if (!emailChangeEmail.trim() || !verificationToken) {
      toast.error('Please verify the email before confirming the change.');
      return;
    }

    changeEmailConfirm.mutate(
      { new_email: emailChangeEmail.trim(), verification_token: verificationToken },
      {
        onSuccess: () => {
          setEmailChangeEmail('');
          setEmailChangeOtp('');
          setVerificationToken('');
          setEmailChangeStage('idle');
        },
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Settings</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Manage your account for <span className="font-semibold text-zinc-700">{username}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Change password */}
        <div className="h-full">
          <section className="h-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
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
                  Old Password*
                </label>
                <div className="relative">
                  <input
                    id="current_password"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                    {...passwordCharsetField(passwordForm.register('current_password'), passwordForm.trigger)}
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
                  New Password*
                </label>
                <div className="relative">
                  <input
                    id="new_password"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                    {...passwordCharsetField(passwordForm.register('new_password'), passwordForm.trigger)}
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
                  <p className="mt-1.5 text-xs font-medium text-red-500">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="new_password2" className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Confirm Password*
                </label>
                <div className="relative">
                  <input
                    id="new_password2"
                    type={showNew2 ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                    {...passwordCharsetField(passwordForm.register('new_password2'), passwordForm.trigger)}
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
                  <p className="mt-1.5 text-xs font-medium text-red-500">{passwordForm.formState.errors.new_password2.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={changePassword.isPending}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {changePassword.isPending ? 'Updating…' : 'Save Changes'}
              </button>
            </form>
          </section>
        </div>

        {/* Right: Email change and notification settings */}
        <div className="h-full space-y-8">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <Bell className="h-5 w-5 text-zinc-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">Email address</h2>
                <p className="mt-0.5 text-sm text-zinc-500">Verify a new email before it becomes active on your account.</p>
              </div>
            </div>

            <form onSubmit={submitEmailChangeRequest} className="space-y-4">
              <div>
                <label htmlFor="new_email" className="mb-1.5 block text-sm font-medium text-zinc-700">
                  New email address
                </label>
                <input
                  id="new_email"
                  type="email"
                  value={emailChangeEmail}
                  onChange={(e) => setEmailChangeEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                />
              </div>

              <button
                type="submit"
                disabled={changeEmailRequest.isPending}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {changeEmailRequest.isPending ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>

            {emailChangeStage !== 'idle' && (
              <div className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div>
                  <label htmlFor="verification_code" className="mb-1.5 block text-sm font-medium text-zinc-700">
                    Verification code
                  </label>
                  <input
                    id="verification_code"
                    type="text"
                    inputMode="numeric"
                    value={emailChangeOtp}
                    onChange={(e) => setEmailChangeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={verifyEmailCode}
                    disabled={changeEmailVerifyOTP.isPending}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {changeEmailVerifyOTP.isPending ? 'Verifying…' : 'Verify code'}
                  </button>

                  {emailChangeStage === 'verified' && (
                    <button
                      type="button"
                      onClick={confirmEmailChange}
                      disabled={changeEmailConfirm.isPending}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {changeEmailConfirm.isPending ? 'Updating…' : 'Confirm email change'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="h-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <div>
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                  <Bell className="h-5 w-5 text-zinc-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950">Notification Setting</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">Choose which notifications you'd like to receive.</p>
                </div>
              </div>

              <NotificationSettings
                settings={notificationSettings}
                onToggle={toggleNotificationSetting}
              />
            </div>
          </section>
        </div>

        {/* Danger zone below spans full width */}
        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
                <p className="mt-0.5 text-sm text-red-700/80">
                  Once you deactivate this account, there is no going back. Please be certain.
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
                Deactivate Account
              </button>
            ) : (
              <form onSubmit={onDeleteAccount} className="space-y-4">
                <p className="text-sm font-medium text-red-800">Enter your password to confirm account deletion.</p>
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
                    <p className="mt-1.5 text-xs font-medium text-red-600">{deleteForm.formState.errors.password.message}</p>
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
    </div>
  );
}

function NotificationSettings({
  settings,
  onToggle,
}: {
  settings: {
    all_notifications: boolean;
    new_internship: boolean;
    preferred_internship: boolean;
    preferred_job: boolean;
  };
  onToggle: (key: 'all_notifications' | 'new_internship' | 'preferred_internship' | 'preferred_job') => void;
}) {
  const items = [
    {
      key: 'all_notifications' as const,
      title: 'All notifications',
      description: 'Receive updates across all activity and account alerts',
    },
    {
      key: 'new_internship' as const,
      title: 'Notify me on new Internship post',
      description: 'Get notified whenever a new internship opportunity is posted',
    },
    {
      key: 'preferred_internship' as const,
      title: 'Notify me on preferred Internship',
      description: 'Alerts matching your saved internship preferences',
    },
    {
      key: 'preferred_job' as const,
      title: 'Notify me on preferred Job',
      description: 'Alerts matching your saved job preferences and skills',
    },
  ];

  return (
    <div className="divide-y divide-zinc-100 border-t border-b border-zinc-100 my-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
            <input
              type="checkbox"
              checked={settings[item.key]}
              onChange={() => onToggle(item.key)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-zinc-950 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-950/10"></div>
          </label>
        </div>
      ))}
    </div>
  );
}
