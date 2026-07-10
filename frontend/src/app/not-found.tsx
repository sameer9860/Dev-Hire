'use client';

import { ErrorPageShell } from '@/components/errors/ErrorPageShell';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <ErrorPageShell
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist, was moved, or the URL might be mistyped."
      icon={MapPinOff}
      iconClassName="text-amber-600"
      iconWrapperClassName="border-amber-100 bg-amber-50 text-amber-600"
    />
  );
}
