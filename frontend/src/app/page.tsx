import Link from 'next/link';
import { Briefcase, Users, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Curated Tech Jobs',
    description: 'Browse hundreds of vetted developer positions from companies actively hiring.',
  },
  {
    icon: Users,
    title: 'Company Dashboards',
    description: 'Post jobs, review applicants, and update candidate status — all in one place.',
  },
  {
    icon: Shield,
    title: 'Role-Based Auth',
    description: 'Separate flows for developers and companies with JWT-secured endpoints.',
  },
  {
    icon: Zap,
    title: 'Instant Applications',
    description: 'Apply to any job in seconds with your saved profile, resume URL, and cover letter.',
  },
];

const HIGHLIGHTS = [
  'Filter by job type, experience level, and remote',
  'Track every application with real-time status',
  'Public developer profiles for your portfolio',
  'Company candidate management dashboard',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-100 bg-white">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#000 1px, transparent 1px), linear-gradient(to right, #000 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 py-28 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-semibold text-zinc-600 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Full-Stack Job Board · Next.js + Django
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.1] mb-6">
            Find your next
            <br />
            <span className="text-zinc-400">developer role.</span>
          </h1>

          <p className="mx-auto max-w-xl text-lg text-zinc-500 leading-relaxed mb-10">
            DevHire connects tech companies with developers. Browse open positions, apply in
            minutes, and track your applications — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md text-sm"
            >
              Browse Jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold px-6 py-3 rounded-xl transition-all duration-150 text-sm"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights strip */}
      <section className="border-b border-zinc-100 bg-zinc-50 py-5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-zinc-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 mb-3">
            Everything you need
          </h2>
          <p className="text-zinc-500 max-w-sm mx-auto">
            Built for both sides of hiring — developers and companies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex gap-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 hover:border-zinc-200 hover:bg-white hover:shadow-sm transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-zinc-100 bg-zinc-950 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
            Ready to start?
          </h2>
          <p className="text-zinc-400 mb-8 text-base">
            Join as a developer to find your next role, or as a company to hire top talent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold px-6 py-3 rounded-xl transition-all text-sm shadow-sm"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center text-zinc-400 hover:text-white font-medium px-4 py-3 rounded-xl transition-colors text-sm"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-semibold text-zinc-700">
            <div className="w-6 h-6 rounded-md bg-zinc-950 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">DH</span>
            </div>
            DevHire
          </div>
          <p>Built by Samir Khatiwada · Next.js 14 + Django REST Framework</p>
        </div>
      </footer>
    </div>
  );
}
