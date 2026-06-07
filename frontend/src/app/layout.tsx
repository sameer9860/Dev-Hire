import { Metadata } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DevHire',
    template: '%s | DevHire',
  },
  description: 'Apply to curated software engineering, design, and product roles at top companies.',
  keywords: ['software developer jobs', 'remote dev roles', 'django nextjs job board', 'tech hiring'],
  authors: [{ name: 'Samir Khatiwada' }],
  creator: 'Samir Khatiwada',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'DevHire',
    title: 'DevHire — Vetted Tech Jobs for Developers',
    description: 'Apply to curated software engineering, design, and product roles at top companies.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}