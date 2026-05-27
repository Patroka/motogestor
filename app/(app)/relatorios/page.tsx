import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RelatoriosClient from './_components/relatorios-client';

export const dynamic = 'force-dynamic';

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <RelatoriosClient />;
}
