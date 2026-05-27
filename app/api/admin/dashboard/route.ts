export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const shops = await prisma.shop.findMany();
    const total = shops.length;
    const active = shops.filter((s: any) => s.status === 'Ativo').length;
    const overdue = shops.filter((s: any) => s.status === 'Atrasado').length;
    const blocked = shops.filter((s: any) => s.status === 'Bloqueado').length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = shops.filter((s: any) => new Date(s.createdAt) >= startOfMonth).length;

    const recentShops = shops
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        ownerName: s.ownerName,
        status: s.status,
        plan: s.plan,
        createdAt: s.createdAt,
      }));

    return NextResponse.json({
      total,
      active,
      overdue,
      blocked,
      newThisMonth,
      recentShops,
    });
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
