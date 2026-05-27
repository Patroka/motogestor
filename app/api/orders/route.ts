export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['Recebida', 'Em análise', 'Aguardando aprovação', 'Em manutenção', 'Pronta para retirada', 'Entregue'];

async function decrementStock(items: any[]) {
  for (const item of items) {
    if (item.productId) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        const newQty = Math.max((product.quantity ?? 0) - (item.quantity ?? 1), 0);
        await prisma.product.update({ where: { id: item.productId }, data: { quantity: newQty } });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'saida',
            quantity: item.quantity ?? 1,
            reason: `OS - ${item.description ?? 'Peça'}`,
          },
        });
      }
    }
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const { searchParams } = new URL(req.url);
    const status = searchParams?.get?.('status') ?? '';
    const search = searchParams?.get?.('search') ?? '';

    const where: any = { shopId };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { plate: { contains: search } },
        { description: { contains: search } },
      ];
      const num = parseInt(search);
      if (!isNaN(num)) {
        where.OR.push({ orderNumber: num });
      }
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
      },
    });

    return NextResponse.json(orders ?? []);
  } catch (error: any) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const body = await req.json();

    const lastOrder = await prisma.serviceOrder.findFirst({
      where: { shopId },
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    const items: any[] = body?.items ?? [];
    const itemsCost = items.reduce((sum: number, it: any) => sum + (it.totalPrice ?? 0), 0);
    const partsCost = itemsCost > 0 ? itemsCost : (parseFloat(body?.partsCost) || 0);
    const laborCost = parseFloat(body?.laborCost) || 0;
    const discount = parseFloat(body?.discount) || 0;
    const totalCost = Math.max((laborCost + partsCost) - discount, 0);

    const order = await prisma.serviceOrder.create({
      data: {
        orderNumber,
        customerId: body?.customerId,
        motorcycle: body?.motorcycle ?? null,
        model: body?.model ?? null,
        plate: body?.plate ?? null,
        description: body?.description ?? '',
        partsUsed: body?.partsUsed ?? null,
        laborCost,
        partsCost,
        discount,
        totalCost,
        status: body?.status ?? 'Recebida',
        paymentMethod: body?.paymentMethod ?? null,
        entryDate: body?.entryDate ? new Date(body.entryDate) : new Date(),
        estimatedDate: body?.estimatedDate ? new Date(body.estimatedDate) : null,
        shopId,
        items: items.length > 0 ? {
          create: items.map((it: any) => ({
            productId: it.productId || null,
            description: it.description ?? '',
            quantity: it.quantity ?? 1,
            unitPrice: it.unitPrice ?? 0,
            totalPrice: it.totalPrice ?? 0,
          })),
        } : undefined,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
      },
    });

    // Decrement stock for physical products
    if (items.length > 0) {
      try { await decrementStock(items); } catch (e) { console.error('Stock decrement error:', e); }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Order POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const body = await req.json();
    const { id, items: newItems, ...data } = body ?? {};

    const existing = await prisma.serviceOrder.findFirst({ where: { id, shopId }, include: { items: true } });
    if (!existing) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 });

    // If items are provided, recalculate partsCost
    let partsCost = data?.partsCost ?? existing.partsCost;
    if (Array.isArray(newItems)) {
      partsCost = newItems.reduce((sum: number, it: any) => sum + (it.totalPrice ?? 0), 0);
      // Delete old items and recreate
      await prisma.serviceOrderItem.deleteMany({ where: { serviceOrderId: id } });
      if (newItems.length > 0) {
        await prisma.serviceOrderItem.createMany({
          data: newItems.map((it: any) => ({
            serviceOrderId: id,
            productId: it.productId || null,
            description: it.description ?? '',
            quantity: it.quantity ?? 1,
            unitPrice: it.unitPrice ?? 0,
            totalPrice: it.totalPrice ?? 0,
          })),
        });
        // Decrement stock for new items
        try { await decrementStock(newItems); } catch (e) { console.error('Stock decrement error:', e); }
      }
    }

    const laborCost = data?.laborCost ?? existing.laborCost;
    const discount = data?.discount ?? existing.discount;
    const totalCost = Math.max((laborCost + partsCost) - discount, 0);

    const updateData: any = {
      description: data?.description ?? existing.description,
      partsUsed: data?.partsUsed !== undefined ? data.partsUsed : existing.partsUsed,
      laborCost,
      partsCost,
      discount,
      totalCost,
      paymentMethod: data?.paymentMethod ?? existing.paymentMethod,
      estimatedDate: data?.estimatedDate ? new Date(data.estimatedDate) : existing.estimatedDate,
    };

    if (data?.motorcycle !== undefined) updateData.motorcycle = data.motorcycle;
    if (data?.model !== undefined) updateData.model = data.model;
    if (data?.plate !== undefined) updateData.plate = data.plate;

    if (data?.status) {
      updateData.status = data.status;
      if (data.status === 'Entregue' && !existing.completedDate) {
        updateData.completedDate = new Date();
      }
    }

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
      },
    });

    // Auto-create CashMovement when status changes to "Entregue"
    if (data?.status === 'Entregue' && existing.status !== 'Entregue') {
      try {
        const openSession = await prisma.cashSession.findFirst({
          where: { shopId, status: 'open' },
        });
        const customerName = order.customer?.name ?? 'Cliente';
        await prisma.cashMovement.create({
          data: {
            type: 'entrada',
            amount: order.totalCost,
            description: `OS #${order.orderNumber} — ${customerName}`,
            paymentMethod: order.paymentMethod,
            cashSessionId: openSession?.id ?? null,
            shopId,
          },
        });
      } catch (cashError) {
        console.error('Error creating CashMovement:', cashError);
      }
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Order PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
