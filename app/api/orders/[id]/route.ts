export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint for tracking
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true } },
        shop: { select: { name: true, phone: true } },
      },
    });

    if (!order) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order?.customer?.name ?? '',
      shopName: order?.shop?.name ?? '',
      shopPhone: order?.shop?.phone ?? '',
      motorcycle: order.motorcycle,
      model: order.model,
      plate: order.plate,
      description: order.description,
      status: order.status,
      estimatedDate: order.estimatedDate,
      updatedAt: order.updatedAt,
    });
  } catch (error: any) {
    console.error('Order tracking error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
