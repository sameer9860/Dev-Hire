'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-100 animate-bounce">
          <HelpCircle className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">404 - Page Not Found</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            The page you are looking for does not exist, has been removed, or has been relocated.
          </p>
        </div>
        
        <div className="pt-2">
          <Link href="/jobs" className="block w-full">
            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white w-full flex items-center justify-center gap-1.5 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Back to Job Board
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
