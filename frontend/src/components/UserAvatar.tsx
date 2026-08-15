'use client';

import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[10px]',
  lg: 'h-10 w-10 text-xs',
};

export function UserAvatar({ src, name, size = 'md', className }: UserAvatarProps) {
  const initials = (name || '?').substring(0, 2).toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          'shrink-0 rounded-full object-cover ring-1 ring-zinc-200',
          SIZE_CLASS[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-bold text-white',
        SIZE_CLASS[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
