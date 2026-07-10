import type { User } from '@/types/api';

export function getDashboardPath(role: User['role']): string {
  return role === 'company' ? '/dashboard/company' : '/dashboard/developer';
}

export function getAuthDestination(user: User | undefined) {
  if (user) {
    return {
      href: getDashboardPath(user.role),
      label: 'Go to Dashboard',
      isAuthenticated: true,
    };
  }

  return {
    href: '/',
    label: 'Go Home',
    isAuthenticated: false,
  };
}

export function hasStoredAuthToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('access_token');
}
