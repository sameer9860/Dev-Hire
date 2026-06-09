import { Metadata } from 'next';
import { PublicProfileClient } from '@/components/profile/PublicProfileClient';

interface Props {
  params: Promise<{ username: string }>;
}

async function getProfileData(username: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  try {
    const res = await fetch(`${apiUrl}/auth/profile/${username}/`, {
      next: { revalidate: 60 }, // Cache response for 1 minute
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching profile details for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileData(username);

  if (!profile) {
    return {
      title: 'Profile Not Found | DevHire',
      description: 'The requested user profile could not be found.',
    };
  }

  const roleLabel = profile.role === 'company' ? 'Company Profile' : 'Developer Profile';
  const title = `${profile.username} (${roleLabel}) | DevHire`;
  const description = profile.bio 
    ? profile.bio.slice(0, 150)
    : `Check out ${profile.username}'s professional profile on DevHire.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      username: profile.username,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  return <PublicProfileClient username={username} />;
}
