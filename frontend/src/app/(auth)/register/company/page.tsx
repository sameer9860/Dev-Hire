'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  companyRegisterSchema,
  type CompanyRegisterFormData,
  noSpaceField,
  PASSWORD_RULES_HELP,
} from '@/schemas/authSchema';
import {
  useRegister,
  useMe,
  useCheckUsername,
  useCheckEmail,
  useCheckCompanyName,
  useCheckCompanyWebsite,
} from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Building2, Globe, Code, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const fieldWrap =
  'flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text';
const inputCls =
  'peer w-full border-none bg-transparent outline-none text-sm text-zinc-900 pt-4 pb-0.5 placeholder-transparent';
const labelCls =
  'absolute left-0 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none transition-all duration-150 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-zinc-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-zinc-500';

export default function CompanyRegisterPage() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<CompanyRegisterFormData>({
    resolver: zodResolver(companyRegisterSchema),
    defaultValues: {
      role: 'company',
      company_name: '',
      company_website: '',
    },
  });

  const registerMutation = useRegister();
  const usernameValue = watch('username') || '';
  const emailValue = watch('email') || '';
  const companyNameValue = watch('company_name') || '';
  const companyWebsiteValue = watch('company_website') || '';
  const passwordValue = watch('password') || '';
  const { data: usernameCheck, isFetching: checkingUsername } = useCheckUsername(usernameValue);
  const { data: emailCheck, isFetching: checkingEmail } = useCheckEmail(emailValue);
  const { data: companyNameCheck, isFetching: checkingCompanyName } =
    useCheckCompanyName(companyNameValue);
  const { data: companyWebsiteCheck, isFetching: checkingCompanyWebsite } =
    useCheckCompanyWebsite(companyWebsiteValue);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  useEffect(() => {
    if (passwordValue) void trigger('password');
  }, [usernameValue, passwordValue, trigger]);

  const onSubmit = (data: CompanyRegisterFormData) => {
    if (usernameCheck && !usernameCheck.available) return;
    if (emailCheck && !emailCheck.available) return;
    if (companyNameCheck && !companyNameCheck.available) return;
    if (companyWebsiteValue.trim() && companyWebsiteCheck && !companyWebsiteCheck.available) return;
    registerMutation.mutate(data);
  };

  const applySuggestion = (suggestion: string) => {
    setValue('username', suggestion, { shouldValidate: true, shouldDirty: true });
    clearErrors('username');
  };

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim());
  const websiteLooksReady =
    companyWebsiteValue.trim().length >= 4 && /[.]/.test(companyWebsiteValue.trim());
  const blockedByAvailability =
    (usernameCheck != null && !usernameCheck.available) ||
    (emailCheck != null && !emailCheck.available) ||
    (companyNameCheck != null && !companyNameCheck.available) ||
    (websiteLooksReady && companyWebsiteCheck != null && !companyWebsiteCheck.available);

  if (!mounted || isLoading || user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin border-4 border-zinc-950 border-t-transparent rounded-full w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 w-full max-w-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
        <div className="text-center mb-7">
          <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Code className="w-5 h-5 text-zinc-900" />
          </div>
          <h2 className="text-[20px] font-medium text-zinc-900 tracking-tight">Company signup</h2>
          <p className="text-[13px] text-zinc-500 mt-1">
            Register with a valid company work email
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className={fieldWrap}>
              <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="username"
                  type="text"
                  placeholder=" "
                  {...noSpaceField(register('username'))}
                  className={inputCls}
                />
                <label htmlFor="username" className={labelCls}>
                  Username
                </label>
              </div>
            </div>
            {errors.username && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.username.message}</p>
            )}
            {!errors.username && usernameValue.trim().length >= 3 && (
              <div className="mt-1.5 pl-1">
                {checkingUsername && (
                  <p className="text-xs font-medium text-zinc-400">Checking username…</p>
                )}
                {!checkingUsername && usernameCheck?.available && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    Username is available
                  </p>
                )}
                {!checkingUsername && usernameCheck && !usernameCheck.available && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <X className="h-3.5 w-3.5" />
                      Username is already taken
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {usernameCheck.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-white hover:text-zinc-950"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className={fieldWrap}>
              <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  {...noSpaceField(register('email'))}
                  className={inputCls}
                />
                <label htmlFor="email" className={labelCls}>
                  Company email
                </label>
              </div>
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.email.message}</p>
            )}
            {!errors.email && emailLooksValid && (
              <div className="mt-1.5 pl-1">
                {checkingEmail && (
                  <p className="text-xs font-medium text-zinc-400">Checking email…</p>
                )}
                {!checkingEmail && emailCheck?.available && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    Email is available
                  </p>
                )}
                {!checkingEmail && emailCheck && !emailCheck.available && (
                  <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <X className="h-3.5 w-3.5" />
                    This email is already registered
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className={fieldWrap}>
              <Building2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="company_name"
                  type="text"
                  placeholder=" "
                  {...noSpaceField(register('company_name'))}
                  className={inputCls}
                />
                <label htmlFor="company_name" className={labelCls}>
                  Company name
                </label>
              </div>
            </div>
            {errors.company_name && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.company_name.message}</p>
            )}
            {!errors.company_name && companyNameValue.trim().length >= 1 && (
              <div className="mt-1.5 pl-1">
                {checkingCompanyName && (
                  <p className="text-xs font-medium text-zinc-400">Checking company name…</p>
                )}
                {!checkingCompanyName && companyNameCheck?.available && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    Company name is available
                  </p>
                )}
                {!checkingCompanyName && companyNameCheck && !companyNameCheck.available && (
                  <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <X className="h-3.5 w-3.5" />
                    This company name is already taken
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className={fieldWrap}>
              <Globe className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="company_website"
                  type="text"
                  placeholder=" "
                  {...noSpaceField(register('company_website'))}
                  className={inputCls}
                />
                <label htmlFor="company_website" className={labelCls}>
                  Website (optional)
                </label>
              </div>
            </div>
            {errors.company_website && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.company_website.message}</p>
            )}
            {!errors.company_website && websiteLooksReady && (
              <div className="mt-1.5 pl-1">
                {checkingCompanyWebsite && (
                  <p className="text-xs font-medium text-zinc-400">Checking website…</p>
                )}
                {!checkingCompanyWebsite && companyWebsiteCheck?.available && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    Website is available
                  </p>
                )}
                {!checkingCompanyWebsite &&
                  companyWebsiteCheck &&
                  !companyWebsiteCheck.available && (
                    <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <X className="h-3.5 w-3.5" />
                      This company website is already registered
                    </p>
                  )}
              </div>
            )}
          </div>

          <div>
            <div className={fieldWrap}>
              <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  {...noSpaceField(register('password'))}
                  className={inputCls}
                />
                <label htmlFor="password" className={labelCls}>
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
            {errors.password ? (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.password.message}</p>
            ) : (
              <p className="text-zinc-400 text-xs mt-1.5 pl-1">{PASSWORD_RULES_HELP}</p>
            )}
          </div>

          <div>
            <div className={fieldWrap}>
              <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="password2"
                  type={showPassword2 ? 'text' : 'password'}
                  placeholder=" "
                  {...noSpaceField(register('password2'))}
                  className={inputCls}
                />
                <label htmlFor="password2" className={labelCls}>
                  Confirm password
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center p-1"
                tabIndex={-1}
              >
                {showPassword2 ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
              </button>
            </div>
            {errors.password2 && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.password2.message}</p>
            )}
          </div>

          {registerMutation.error && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 font-medium">
              Registration failed. Please check your information.
            </p>
          )}

          <button
            type="submit"
            disabled={
              registerMutation.isPending ||
              checkingUsername ||
              checkingEmail ||
              checkingCompanyName ||
              (websiteLooksReady && checkingCompanyWebsite) ||
              blockedByAvailability
            }
            className="w-full py-2.5 bg-zinc-950 text-white border-none rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
          >
            {registerMutation.isPending ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 mr-2"></span>
            ) : null}
            <span>{registerMutation.isPending ? 'Registering...' : 'Create account'}</span>
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Looking for a job?{' '}
          <Link href="/register/developer" className="font-bold text-zinc-950 hover:underline">
            Developer
          </Link>
        </p>
        <p className="mt-2 text-center text-[13px] text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-zinc-950 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
