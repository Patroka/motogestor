import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ClientesClient from './_components/clientes-client';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <ClientesClient />;
}
