'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/schemas/authSchema';
import { useRegister } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Building2, Globe, Code } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useAuth';

export default function RegisterPage() {
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'developer',
      company_name: '',
      company_website: '',
    },
  });

  const registerMutation = useRegister();
  const selectedRole = watch('role');

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const onSubmit = (data: RegisterFormData) => {
    const payload = {
      ...data,
      company_name: data.role === 'company' ? data.company_name : undefined,
      company_website: data.role === 'company' ? data.company_website : undefined,
    };
    registerMutation.mutate(payload);
  };

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
        
        {/* Header section */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Code className="w-5 h-5 text-zinc-900" />
          </div>
          <h2 className="text-[20px] font-medium text-zinc-900 tracking-tight">Create your account</h2>
          <p className="text-[13px] text-zinc-500 mt-1">Join DevHire today</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Role Selection */}
          <div>
            <label className="block text-[12px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Register as:</label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`flex items-center justify-center py-2 border rounded-lg cursor-pointer text-xs font-semibold transition-all ${
                  selectedRole === 'developer'
                    ? 'border-zinc-950 bg-zinc-50 text-zinc-950 shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  value="developer"
                  {...register('role')}
                  className="sr-only"
                />
                Developer
              </label>
              <label
                className={`flex items-center justify-center py-2 border rounded-lg cursor-pointer text-xs font-semibold transition-all ${
                  selectedRole === 'company'
                    ? 'border-zinc-950 bg-zinc-50 text-zinc-950 shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  value="company"
                  {...register('role')}
                  className="sr-only"
                />
                Company
              </label>
            </div>
            {errors.role && <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.role.message}</p>}
          </div>

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

          {/* Email Field */}
          <div>
            <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
              <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  {...register('email')}
                  className="peer w-full border-none bg-transparent outline-none text-sm text-zinc-900 pt-4 pb-0.5 placeholder-transparent"
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none transition-all duration-150 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-zinc-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-zinc-500"
                >
                  Email Address
                </label>
              </div>
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* Company Fields (only visible if company role selected) */}
          {selectedRole === 'company' && (
            <div className="space-y-4 border-t border-zinc-100 pt-4">
              
              {/* Company Name */}
              <div>
                <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
                  <Building2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <div className="flex-1 relative h-11">
                    <input
                      id="company_name"
                      type="text"
                      placeholder=" "
                      {...register('company_name')}
                      className="peer w-full border-none bg-transparent outline-none text-sm text-zinc-900 pt-4 pb-0.5 placeholder-transparent"
                    />
                    <label
                      htmlFor="company_name"
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none transition-all duration-150 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-zinc-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-zinc-500"
                    >
                      Company Name
                    </label>
                  </div>
                </div>
                {errors.company_name && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.company_name.message}</p>
                )}
              </div>

              {/* Company Website */}
              <div>
                <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
                  <Globe className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <div className="flex-1 relative h-11">
                    <input
                      id="company_website"
                      type="text"
                      placeholder=" "
                      {...register('company_website')}
                      className="peer w-full border-none bg-transparent outline-none text-sm text-zinc-900 pt-4 pb-0.5 placeholder-transparent"
                    />
                    <label
                      htmlFor="company_website"
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none transition-all duration-150 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-zinc-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-zinc-500"
                    >
                      Company Website (optional)
                    </label>
                  </div>
                </div>
                {errors.company_website && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{errors.company_website.message}</p>
                )}
              </div>

            </div>
          )}

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

          {/* Confirm Password Field */}
          <div>
            <div className="flex items-center gap-2.5 border border-zinc-200 rounded-lg px-3.5 py-1 transition-all duration-150 focus-within:border-zinc-900 cursor-text">
              <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 relative h-11">
                <input
                  id="password2"
                  type={showPassword2 ? 'text' : 'password'}
                  placeholder=" "
                  {...register('password2')}
                  className="peer w-full border-none bg-transparent outline-none text-sm text-zinc-900 pt-4 pb-0.5 placeholder-transparent"
                />
                <label
                  htmlFor="password2"
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none transition-all duration-150 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-zinc-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-zinc-500"
                >
                  Confirm Password
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

          {/* Registration Error */}
          {registerMutation.error && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 font-medium">
              Registration failed. {registerMutation.error.message || 'Please check your information.'}
            </p>
          )}

          {/* Register Submit Button */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full py-2.5 bg-zinc-950 text-white border-none rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
          >
            {registerMutation.isPending ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 mr-2"></span>
            ) : null}
            <span>{registerMutation.isPending ? 'Registering...' : 'Register'}</span>
          </button>
          
        </form>

        {/* Login Link */}
        <p className="text-center text-[13px] text-zinc-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-zinc-950 font-semibold hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
