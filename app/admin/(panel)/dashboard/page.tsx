export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './_components/admin-dashboard-client';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'superadmin') {
    redirect('/admin/login');
  }
  return <AdminDashboardClient />;
}
