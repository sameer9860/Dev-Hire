import { Metadata } from 'next';
import { JobDetailClient } from '@/components/jobs/JobDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

async function getJobData(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  try {
    const res = await fetch(`${apiUrl}/jobs/${id}/`, {
      next: { revalidate: 60 }, // Cache response for 1 minute
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching job details for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobData(id);

  if (!job) {
    return {
      title: 'Job Not Found | DevHire',
      description: 'The requested job listing could not be found.',
    };
  }

  const title = `${job.title} at ${job.company.company_name} | DevHire`;
  const description = `${job.title} opportunity in ${job.location}. Required skills: ${job.tech_stack?.join(', ')}. ${job.description?.slice(0, 120)}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: job.created_at,
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const jobId = Number(id);

  return <JobDetailClient jobId={jobId} />;
}