import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as any;
}

export async function getShopId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.shopId ?? null;
}
