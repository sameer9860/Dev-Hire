'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/schemas/authSchema';
import { useLogin } from '@/hooks/useAuth';
import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Code } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (data: LoginFormData) => login.mutate(data);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 w-full max-w-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
        
        {/* Header section */}
        <div className="text-center mb-7">
          <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Code className="w-5 h-5 text-zinc-900" />
          </div>
          <h2 className="text-[20px] font-medium text-zinc-900 tracking-tight">Welcome back</h2>
          <p className="text-[13px] text-zinc-500 mt-1">Sign in to your DevHire account</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Username Field */}
          <div>
            <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
              <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="username"
                  type="text"
                  placeholder=" "
                  {...register('username')}
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

          {/* Password Field */}
          <div>
            <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
              <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  {...register('password')}
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

          {/* Forgot Password Link */}
          <div className="text-right -mt-1.5">
            <a
              href="#"
              className="text-[13px] text-zinc-500 hover:text-zinc-950 transition-colors text-right inline-block"
            >
              Forgot password?
            </a>
          </div>

          {/* Error Message */}
          {login.error && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 font-medium">
              Invalid credentials. Please try again.
            </p>
          )}

          {/* Sign In Button */}
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

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-[0.5px] bg-zinc-200"></div>
          <span className="text-[12px] text-zinc-400 font-medium">or</span>
          <div className="flex-1 h-[0.5px] bg-zinc-200"></div>
        </div>

        {/* Social SSO Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            type="button"
            className="py-2.5 border border-zinc-200 rounded-lg bg-white text-[13px] font-medium text-zinc-800 cursor-pointer flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.58 1.68l3.4-3.4A11.95 11.95 0 0 0 12 1C8.08 1 4.67 3 2.69 6.07l2.58 3.69Z"
              />
              <path
                fill="#34A853"
                d="M16.04 18.01A7.08 7.08 0 0 1 12 19.1c-2.97 0-5.5-1.82-6.62-4.43l-2.69 3.85A11.96 11.96 0 0 0 12 23c2.93 0 5.73-1.06 7.83-3l-3.79-1.99Z"
              />
              <path
                fill="#4A90D9"
                d="M19.83 20c2.26-2.1 3.67-5.18 3.17-9H12v4.18h6.28a5.43 5.43 0 0 1-2.24 3.82l3.79 1.99Z"
              />
              <path
                fill="#FBBC05"
                d="M5.38 14.67A7.12 7.12 0 0 1 4.9 12c0-.93.17-1.83.47-2.67l-2.68-3.7A11.9 11.9 0 0 0 1 12c0 1.97.48 3.83 1.32 5.47l3.06-2.8Z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            className="py-2.5 border border-zinc-200 rounded-lg bg-white text-[13px] font-medium text-zinc-800 cursor-pointer flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
          >
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </button>
        </div>

        {/* Signup Link */}
        <p className="text-center text-[13px] text-zinc-500">
          No account?{' '}
          <Link href="/register" className="text-zinc-950 font-semibold hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}
