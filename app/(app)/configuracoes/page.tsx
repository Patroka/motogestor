export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ConfiguracoesClient } from './_components/configuracoes-client';

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <ConfiguracoesClient />;
}
