import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EstoqueClient from './_components/estoque-client';

export const dynamic = 'force-dynamic';

export default async function EstoquePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <EstoqueClient />;
}
