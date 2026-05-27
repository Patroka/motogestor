export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const shopId = (session.user as any)?.shopId;
    if (!shopId) {
      return NextResponse.json({ error: 'Oficina não encontrada' }, { status: 400 });
    }

    // Fetch all shop-scoped data
    const [shop, users, customers, serviceOrders, products, cashSessions] = await Promise.all([
      prisma.shop.findUnique({ where: { id: shopId } }),
      prisma.user.findMany({ where: { shopId }, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.customer.findMany({ where: { shopId } }),
      prisma.serviceOrder.findMany({ where: { shopId }, include: { items: true } }),
      prisma.product.findMany({ where: { shopId }, include: { stockMovements: true } }),
      prisma.cashSession.findMany({ where: { shopId }, include: { movements: true } }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      shopName: shop?.name ?? 'Desconhecido',
      shopId,
      data: {
        oficina: shop,
        usuarios: users,
        clientes: customers,
        ordensDeServico: serviceOrders,
        produtos: products,
        sessoesCaixa: cashSessions,
      },
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const fileName = `backup-${(shop?.name ?? 'oficina').replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Erro ao gerar backup' }, { status: 500 });
  }
}
