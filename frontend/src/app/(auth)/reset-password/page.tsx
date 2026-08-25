'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePasswordResetConfirm } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Code, CheckCircle2, AlertCircle } from 'lucide-react';
import { ALLOWED_PASSWORD_CHARS, PASSWORD_CHARSET_ERROR } from '@/schemas/authSchema';

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((v) => !v || ALLOWED_PASSWORD_CHARS.test(v), PASSWORD_CHARSET_ERROR)
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/\d/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    new_password2: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.new_password2, {
    message: "Passwords don't match",
    path: ['new_password2'],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const uid = searchParams?.get('uid') || '';
  const token = searchParams?.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const confirm = usePasswordResetConfirm();

  const onSubmit = (data: FormData) => {
    if (!uid || !token) return;
    confirm.mutate({
      uid,
      token,
      new_password: data.new_password,
      new_password2: data.new_password2,
    });
  };

  if (!uid || !token) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">Invalid Reset Link</h2>
        <p className="text-sm text-zinc-600">
          This password reset link is invalid or incomplete. Please request a new reset link.
        </p>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="inline-block w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  if (confirm.isSuccess) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">Password Reset Complete</h2>
        <p className="text-sm text-zinc-600">
          Your password has been successfully updated. You can now sign in with your new password.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900">Set new password</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
              {...register('new_password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
              tabIndex={-1}
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errors.new_password && (
            <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.new_password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword2 ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full border border-zinc-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
              {...register('new_password2')}
            />
            <button
              type="button"
              onClick={() => setShowPassword2(!showPassword2)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
              tabIndex={-1}
            >
              {showPassword2 ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errors.new_password2 && (
            <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.new_password2.message}</p>
          )}
        </div>

        {confirm.isError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
            {(confirm.error as any)?.response?.data?.detail || 'Failed to reset password. The link may have expired.'}
          </div>
        )}

        <button
          type="submit"
          disabled={confirm.isPending}
          className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer mt-2"
        >
          {confirm.isPending ? 'Saving New Password...' : 'Save New Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-md group-hover:bg-zinc-800 transition-colors">
            <Code className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">DevHire</span>
        </Link>
      </div>

      <div className="w-full max-w-[440px]">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Suspense fallback={<div className="text-center py-6 text-sm text-zinc-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
