import { Metadata } from 'next';
import JobsPageClient from '@/components/jobs/JobsPageClient';

export const metadata: Metadata = {
  title: 'Find Tech Jobs',
  description: 'Search and filter vetted software development opportunities. Filter by experience level, remote availability, and job types.',
};

export default function JobsPage() {
  return <JobsPageClient />;
}
