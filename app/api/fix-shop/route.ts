import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('key') !== 'fix2026') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const c = await prisma.customer.updateMany({ where: { shopId: 'cmovly7wj0000rw084dtc4bwz' }, data: { shopId: 'shop-vinicius-001' } });
  const p = await prisma.product.updateMany({ where: { shopId: 'cmovly7wj0000rw084dtc4bwz' }, data: { shopId: 'shop-vinicius-001' } });
  return NextResponse.json({ clientes: c.count, produtos: p.count });
}