'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useMe } from '@/hooks/useAuth';
import { deleteCookie } from '@/lib/cookies';
import { 
  Briefcase, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight, 
  CheckCircle,
  LayoutDashboard,
  User,
  ExternalLink,
  LogOut
} from 'lucide-react';


const FEATURES = [
  {
    icon: Briefcase,
    title: 'Curated Tech Jobs',
    description: 'Browse hundreds of vetted developer positions from companies actively hiring.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80',
  },
  {
    icon: Users,
    title: 'Company Dashboards',
    description: 'Post jobs, review applicants, and update candidate status — all in one place.',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80',
  },
  {
    icon: Shield,
    title: 'Role-Based Auth',
    description: 'Separate flows for developers and companies with JWT-secured endpoints.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
  },
  {
    icon: Zap,
    title: 'Instant Applications',
    description: 'Apply to any job in seconds with your saved profile, resume URL, and cover letter.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
  },
];

const HIGHLIGHTS = [
  'Filter by job type, experience level, and remote',
  'Track every application with real-time status',
  'Public developer profiles for your portfolio',
  'Company candidate management dashboard',
];

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useMe();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    queryClient.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-100 bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="text-center lg:text-left">
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-zinc-950 sm:text-6xl">
              Find your next
              <br />
              <span className="text-zinc-400">developer role.</span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-zinc-500 lg:mx-0">
              DevHire connects tech companies with developers. Browse open positions, apply in
              minutes, and track your applications — all in one place.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {!mounted || isLoading ? (
                <div className="h-11 w-32 bg-zinc-100 rounded-xl animate-pulse"></div>
              ) : user ? (
                <>
                  <Link
                    href={user.role === 'company' ? '/dashboard/company' : '/dashboard/developer'}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 hover:shadow-md"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <User className="h-4 w-4 text-zinc-500" />
                    My Profile
                  </Link>
                  <Link
                    href={`/profile/${user.username}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                    Public Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 text-red-600 px-6 py-3 text-sm font-semibold transition-all duration-150 hover:bg-red-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 hover:shadow-md"
                  >
                    Browse Jobs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80"
                alt="Developers collaborating on a project"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="relative hidden h-28 w-28 overflow-hidden rounded-xl border-4 border-white shadow-md sm:absolute sm:-bottom-5 sm:-left-5">
              <Image
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80"
                alt="Professional in a meeting"
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
            <div className="relative hidden h-24 w-24 overflow-hidden rounded-xl border-4 border-white shadow-md sm:absolute sm:-right-4 sm:-top-4">
              <Image
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&q=80"
                alt="Team working together"
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Highlights strip */}
      <section className="border-b border-zinc-100 bg-zinc-50 py-5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-zinc-600">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-zinc-950">
            Everything you need
          </h2>
          <p className="mx-auto max-w-sm text-zinc-500">
            Built for both sides of hiring — developers and companies.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description, image }) => (
            <div
              key={title}
              className="group overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/50 transition-all duration-200 hover:border-zinc-200 hover:bg-white hover:shadow-sm"
            >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
                <div className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-sm backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-zinc-900" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-1 font-semibold text-zinc-900">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden border-t border-zinc-100 bg-zinc-950 py-20">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-zinc-950/85" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">
            Ready to start?
          </h2>
          <p className="mb-8 text-base text-zinc-400">
            Join as a developer to find your next role, or as a company to hire top talent.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!mounted || isLoading ? (
              <div className="h-11 w-32 bg-zinc-800 rounded-xl animate-pulse"></div>
            ) : user ? (
              <>
                <Link
                  href={user.role === 'company' ? '/dashboard/company' : '/dashboard/developer'}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-all hover:bg-zinc-100"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  <User className="h-4 w-4 mr-1.5" />
                  My Profile
                </Link>
                <Link
                  href={`/profile/${user.username}`}
                  className="inline-flex items-center rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Public Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:text-red-500"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-all hover:bg-zinc-100"
                >
                  Get Started — It&apos;s Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  Already have an account? Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <p className="text-center text-sm font-bold text-zinc-800">
          © {new Date().getFullYear()} Samir Khatiwada. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
