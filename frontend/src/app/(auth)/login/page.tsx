'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData, noSpaceField } from '@/schemas/authSchema';
import { useLogin, useMe } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Code } from 'lucide-react';
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (data: LoginFormData) => login.mutate(data);

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
                  {...noSpaceField(register('username'))}
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
                  {...noSpaceField(register('password'))}
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
            <a
              href="#"
              className="text-[13px] text-zinc-500 hover:text-zinc-950 transition-colors text-right inline-block"
            >
              Forgot password?
            </a>
          </div>

          {login.error && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 font-medium">
              Invalid credentials. Please try again.
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
    </div>
  );
}
