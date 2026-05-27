import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Re-export authOptions as adminAuthOptions for backward compatibility
// Admin auth now uses the same NextAuth instance as shop auth
export const adminAuthOptions = authOptions;

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'superadmin') return null;
  return session;
}
