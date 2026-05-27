export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLoginClient from './_components/admin-login-client';

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user && (session.user as any)?.role === 'superadmin') {
    redirect('/admin/dashboard');
  }
  return <AdminLoginClient />;
}
