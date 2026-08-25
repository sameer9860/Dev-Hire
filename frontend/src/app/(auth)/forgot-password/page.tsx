'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  usePasswordResetRequest,
  usePasswordResetVerifyOTP,
  usePasswordResetConfirm,
} from '@/hooks/useAuth';
import Link from 'next/link';
import {
  Mail,
  ArrowLeft,
  Code,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ALLOWED_PASSWORD_CHARS, PASSWORD_CHARSET_ERROR } from '@/schemas/authSchema';

// Schema for Step 1: Email
const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});
type EmailFormData = z.infer<typeof emailSchema>;

// Schema for Step 3: New Password
const passwordSchema = z
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
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [userEmail, setUserEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  // OTP Digits (6 individual input boxes)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Timer
  const [resendTimer, setResendTimer] = useState(0);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Mutations
  const requestMutation = usePasswordResetRequest();
  const verifyMutation = usePasswordResetVerifyOTP();
  const confirmMutation = usePasswordResetConfirm();

  // Forms
  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  // Resend countdown timer effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first OTP input on Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Handler for Step 1: Send OTP
  const onEmailSubmit = (data: EmailFormData) => {
    const email = data.email.trim().toLowerCase();
    setUserEmail(email);
    requestMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setStep(2);
          setResendTimer(60);
        },
      }
    );
  };

  // Handler for Resending OTP
  const handleResendOTP = () => {
    if (resendTimer > 0 || !userEmail) return;
    requestMutation.mutate(
      { email: userEmail },
      {
        onSuccess: () => {
          setResendTimer(60);
          setOtpDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        },
      }
    );
  };

  // Handler for OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    // Handle paste of full 6 digit code
    if (cleanVal.length >= 6) {
      const digits = cleanVal.slice(0, 6).split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleanVal[cleanVal.length - 1];
    setOtpDigits(updated);

    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pasted.length >= 6) {
      const digits = pasted.slice(0, 6).split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Handler for Step 2: Verify OTP
  const onVerifyOTP = () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) return;

    verifyMutation.mutate(
      { email: userEmail, otp: fullOtp },
      {
        onSuccess: (data) => {
          setResetToken(data.reset_token);
          setStep(3);
        },
      }
    );
  };

  // Handler for Step 3: Set New Password
  const onPasswordSubmit = (data: PasswordFormData) => {
    confirmMutation.mutate(
      {
        email: userEmail,
        reset_token: resetToken,
        new_password: data.new_password,
        new_password2: data.new_password2,
      },
      {
        onSuccess: () => {
          setStep(4);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
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
          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Forgot your password?</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Enter your registered account email and we&apos;ll send you a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className="w-full border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                      {...emailForm.register('email')}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {requestMutation.isError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                    {(requestMutation.error as any)?.response?.data?.detail ||
                      'Failed to send verification code. Please try again.'}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={requestMutation.isPending}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {requestMutation.isPending ? 'Sending 6-Digit Code...' : 'Send Verification Code'}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* STEP 2: Enter 6-Digit OTP */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Enter Verification Code</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-zinc-800">{userEmail}</span>.
                </p>
              </div>

              <div className="space-y-5">
                {/* 6 Digit Input Grid */}
                <div className="flex justify-between items-center gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-13 border-2 border-zinc-200 rounded-xl text-center text-lg font-bold text-zinc-900 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/20 outline-none bg-zinc-50/50 transition-colors"
                    />
                  ))}
                </div>

                {verifyMutation.isError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                    {(verifyMutation.error as any)?.response?.data?.detail ||
                      'Invalid or expired code. Please try again.'}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onVerifyOTP}
                  disabled={otpDigits.join('').length !== 6 || verifyMutation.isPending}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {verifyMutation.isPending ? 'Verifying Code...' : 'Verify Code'}
                </button>

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="hover:text-zinc-900 font-medium transition-colors"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || requestMutation.isPending}
                    className="inline-flex items-center gap-1 hover:text-zinc-900 font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Set New Password</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Code verified! Please create a strong new password for your account.
                </p>
              </div>

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
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
                      {...passwordForm.register('new_password')}
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
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">
                      {passwordForm.formState.errors.new_password.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
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
                      {...passwordForm.register('new_password2')}
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
                  {passwordForm.formState.errors.new_password2 && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">
                      {passwordForm.formState.errors.new_password2.message}
                    </p>
                  )}
                </div>

                {confirmMutation.isError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                    {(confirmMutation.error as any)?.response?.data?.detail ||
                      'Failed to reset password. Please try again.'}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={confirmMutation.isPending}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer mt-2"
                >
                  {confirmMutation.isPending ? 'Saving New Password...' : 'Save New Password'}
                </button>
              </form>
            </>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Password Reset Complete</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Your password has been successfully updated. You can now sign in to your DevHire account with your new password.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-block w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
                >
                  Sign In Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
