import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('key') !== 'setup2026') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await prisma.shop.upsert({ where: { id: 'shop-vinicius-001' }, update: {}, create: { id: 'shop-vinicius-001', name: 'Vinicius Motos', ownerName: 'Vinicius', phone: '', status: 'Ativo' } });
    await prisma.adminUser.upsert({ where: { email: 'patrickandradeemalta@gmail.com' }, update: { hashedPassword: '$2b$10$L94uJYqlFk123QO/gvcs6eZ50yjWvDx2pm7wOrjakuzLZbmlQMKdq' }, create: { id: 'admin-patrick-001', name: 'Patrick', email: 'patrickandradeemalta@gmail.com', hashedPassword: '$2b$10$L94uJYqlFk123QO/gvcs6eZ50yjWvDx2pm7wOrjakuzLZbmlQMKdq' } });
    await prisma.user.upsert({ where: { email: 'patrickandradeemalta@gmail.com' }, update: { hashedPassword: '$2b$10$L94uJYqlFk123QO/gvcs6eZ50yjWvDx2pm7wOrjakuzLZbmlQMKdq' }, create: { id: 'user-patrick-001', name: 'Patrick', email: 'patrickandradeemalta@gmail.com', hashedPassword: '$2b$10$L94uJYqlFk123QO/gvcs6eZ50yjWvDx2pm7wOrjakuzLZbmlQMKdq', role: 'admin', shopId: 'shop-vinicius-001' } });
    return NextResponse.json({ ok: true });
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
