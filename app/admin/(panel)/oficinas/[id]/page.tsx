export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ShopDetailClient from './_components/shop-detail-client';

export default async function ShopDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'superadmin') {
    redirect('/admin/login');
  }
  return <ShopDetailClient shopId={params.id} />;
}
