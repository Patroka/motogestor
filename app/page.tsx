import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingClient from './_components/landing-client';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role === 'superadmin';

  return <LandingClient isLoggedIn={isLoggedIn} isAdmin={isAdmin} />;
}