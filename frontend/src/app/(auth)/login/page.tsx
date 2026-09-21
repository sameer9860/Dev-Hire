'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData, passwordCharsetField } from '@/schemas/authSchema';
import { useLogin, useMe, useReactivateVerifyOTP, useReactivateRequestOTP } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Code, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeveloperOAuthButtons from '@/components/auth/DeveloperOAuthButtons';

export default function LoginPage() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });
  const login = useLogin();
  const verifyOTP = useReactivateVerifyOTP();
  const resendOTP = useReactivateRequestOTP();

  const [showPassword, setShowPassword] = useState(false);

  // Inactive Account Reactivation OTP state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');

  useEffect(() => {
    const errorData = (login.error as any)?.response?.data;
    if (errorData?.inactive_verification_required) {
      setOtpEmail(errorData.email || '');
      setShowOTPModal(true);
    }
  }, [login.error]);

  const onSubmit = (data: LoginFormData) => login.mutate(data);

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || !otpEmail) return;
    verifyOTP.mutate({ email: otpEmail, otp: otpInput.trim() });
  };

  const handleResendCode = () => {
    if (!otpEmail) return;
    resendOTP.mutate({ email: otpEmail });
  };

  if (!mounted || isLoading || user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin border-4 border-zinc-950 border-t-transparent rounded-full w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8 relative">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 w-full max-w-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
        <div className="text-center mb-7">
          <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Code className="w-5 h-5 text-zinc-900" />
          </div>
          <h2 className="text-[20px] font-medium text-zinc-900 tracking-tight">Welcome back</h2>
          <p className="text-[13px] text-zinc-500 mt-1">Sign in to your DevHire account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
              <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="username"
                  type="text"
                  placeholder=" "
                  {...passwordCharsetField(register('username'), trigger)}
                  className="peer w-full border-none bg-transparent outline-none text-sm text-zinc-900 pt-4 pb-0.5 placeholder-transparent"
                />
                <label
                  htmlFor="username"
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none transition-all duration-150 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-zinc-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-zinc-500"
                >
                  Username
                </label>
              </div>
            </div>
            {errors.username && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
              <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  {...passwordCharsetField(register('password'), trigger)}
                  className="peer w-full border-none bg-transparent outline-none text-sm text-zinc-900 pt-4 pb-0.5 placeholder-transparent"
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none transition-all duration-150 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-zinc-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-zinc-500"
                >
                  Password
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center p-1"
                tabIndex={-1}
              >
                {showPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.password.message}</p>
            )}
          </div>

          <div className="text-right -mt-1.5">
            <Link
              href="/forgot-password"
              className="text-[13px] text-zinc-500 hover:text-zinc-950 transition-colors text-right inline-block"
            >
              Forgot password?
            </Link>
          </div>

          {login.error && !(login.error as any)?.response?.data?.inactive_verification_required && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 font-medium">
              {(login.error as any)?.response?.status === 429
                ? (login.error as any)?.response?.data?.detail || 'Too many failed attempts. Please try again later.'
                : (login.error as any)?.response?.data?.detail || 'Invalid credentials. Please try again.'}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full py-2.5 bg-zinc-950 text-white border-none rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
          >
            {login.isPending ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 mr-2"></span>
            ) : null}
            <span>{login.isPending ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-[0.5px] bg-zinc-200"></div>
          <span className="text-[12px] text-zinc-400 font-medium">or</span>
          <div className="flex-1 h-[0.5px] bg-zinc-200"></div>
        </div>

        <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Developers - social login
        </p>
        <DeveloperOAuthButtons labelPrefix="Continue with" action="sign-in" />

        <p className="mt-5 text-center text-[13px] text-zinc-500">
          No account? Register as
          <br />
          <Link href="/register/developer" className="font-bold text-zinc-950 hover:underline">
            Developer
          </Link>
          {' / '}
          <Link href="/register/company" className="font-bold text-zinc-950 hover:underline">
            Company
          </Link>
        </p>
      </div>

      {/* Account Reactivation OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900">Account Reactivation Required</h3>
              <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                Your account was deactivated due to 30 days of inactivity. A 6-digit verification code has been sent to{' '}
                <span className="font-semibold text-zinc-900">{otpEmail}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-center font-mono text-lg tracking-[0.3em] text-zinc-900 outline-none focus:border-zinc-950 focus:bg-white focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyOTP.isPending || otpInput.length !== 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {verifyOTP.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reactivate & Sign In'
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendOTP.isPending}
                className="font-semibold text-zinc-700 hover:text-zinc-950 hover:underline disabled:opacity-50"
              >
                {resendOTP.isPending ? 'Sending...' : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => setShowOTPModal(false)}
                className="font-medium text-zinc-500 hover:text-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
