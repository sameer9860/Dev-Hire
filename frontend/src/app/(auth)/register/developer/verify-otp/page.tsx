'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyRegistrationOTP, useResendRegistrationOTP, useMe } from '@/hooks/useAuth';
import { ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

function VerifyOTPContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = decodeURIComponent(searchParams.get('email') || '');

  const { data: user, isLoading } = useMe();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));

  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const verifyMutation = useVerifyRegistrationOTP();
  const resendMutation = useResendRegistrationOTP();

  const otp = digits.join('');

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH || !email) return;
    verifyMutation.mutate({ email, otp });
  };

  const handleResend = () => {
    if (!canResend || resendMutation.isPending) return;
    resendMutation.mutate({ email });
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  if (!mounted || isLoading || user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin border-4 border-zinc-950 border-t-transparent rounded-full w-8 h-8" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-500 text-sm mb-4">Invalid verification link.</p>
          <Link href="/register/developer" className="font-semibold text-zinc-950 hover:underline text-sm">
            Back to registration
          </Link>
        </div>
      </div>
    );
  }

  const allFilled = digits.every(Boolean);
  const isPending = verifyMutation.isPending;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 w-full max-w-[420px] shadow-[0_8px_30px_rgb(0,0,0,0.02)]">

        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 mx-auto mb-4 shadow-sm hover:bg-zinc-800 transition-colors"
          >
            <span className="text-sm font-bold text-white">DH</span>
          </Link>
          <div className="flex items-center justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-[20px] font-medium text-zinc-900 tracking-tight">
            Verify your email
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-zinc-900">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP digit inputs */}
          <div>
            <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={i === 0}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={[
                    'h-12 w-11 rounded-xl border text-center text-lg font-bold text-zinc-900 outline-none transition-all duration-150',
                    digit
                      ? 'border-zinc-900 bg-zinc-950 text-white shadow-sm'
                      : 'border-zinc-200 bg-zinc-50 focus:border-zinc-900 focus:bg-white',
                  ].join(' ')}
                />
              ))}
            </div>
            <p className="text-center text-[11px] text-zinc-400 mt-3">
              Enter the 6-digit code · Expires in 10 minutes
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!allFilled || isPending}
            className="w-full py-2.5 bg-zinc-950 text-white border-none rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            {isPending ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
            ) : null}
            <span>{isPending ? 'Verifying...' : 'Verify & activate account'}</span>
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-700 hover:text-zinc-950 transition-colors disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {resendMutation.isPending ? 'Sending...' : 'Resend code'}
            </button>
          ) : (
            <p className="text-[13px] text-zinc-400">
              Resend code in{' '}
              <span className="font-semibold text-zinc-700 tabular-nums">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Back link */}
        <div className="mt-5 text-center">
          <Link
            href="/register/developer"
            className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="animate-spin border-4 border-zinc-950 border-t-transparent rounded-full w-8 h-8" />
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
