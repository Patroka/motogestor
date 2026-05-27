import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CaixaClient from './_components/caixa-client';

export const dynamic = 'force-dynamic';

export default async function CaixaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <CaixaClient />;
}
