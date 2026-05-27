import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrdensClient from './_components/ordens-client';

export const dynamic = 'force-dynamic';

export default async function OrdensPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <OrdensClient />;
}
