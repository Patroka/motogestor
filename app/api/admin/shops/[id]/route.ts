export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        paymentHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
        activityLog: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: {
          select: { customers: true, serviceOrders: true, products: true },
        },
      },
    });

    if (!shop) return NextResponse.json({ error: 'Oficina não encontrada' }, { status: 404 });

    return NextResponse.json(shop);
  } catch (error: any) {
    console.error('Admin shop detail error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
