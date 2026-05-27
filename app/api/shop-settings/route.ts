export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    if (!shopId) return NextResponse.json({ error: 'Oficina não encontrada' }, { status: 404 });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, phone: true, address: true, ownerName: true },
    });

    if (!shop) return NextResponse.json({ error: 'Oficina não encontrada' }, { status: 404 });
    return NextResponse.json(shop);
  } catch (error) {
    console.error('GET /api/shop-settings error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    if (!shopId) return NextResponse.json({ error: 'Oficina não encontrada' }, { status: 404 });

    const body = await req.json();
    const { name, phone, address, ownerName } = body ?? {};

    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(ownerName !== undefined && { ownerName }),
      },
      select: { id: true, name: true, phone: true, address: true, ownerName: true },
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error('PUT /api/shop-settings error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
