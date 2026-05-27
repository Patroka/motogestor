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
    if (!shopId) return NextResponse.json({ error: 'Shop não encontrado' }, { status: 400 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Daily revenue
    const dailyOrders = await prisma.serviceOrder.findMany({
      where: {
        shopId,
        status: 'Entregue',
        completedDate: { gte: today, lt: tomorrow },
      },
    });
    const dailyRevenue = dailyOrders?.reduce?.((sum: number, o: any) => sum + (o?.totalCost ?? 0), 0) ?? 0;

    // Services done today
    const servicesCompleted = await prisma.serviceOrder.count({
      where: {
        shopId,
        status: 'Entregue',
        completedDate: { gte: today, lt: tomorrow },
      },
    });

    // Customers served today
    const todayOrders = await prisma.serviceOrder.findMany({
      where: {
        shopId,
        entryDate: { gte: today, lt: tomorrow },
      },
      select: { customerId: true },
    });
    const uniqueCustomers = new Set(todayOrders?.map?.((o: any) => o?.customerId) ?? []);
    const customersServed = uniqueCustomers?.size ?? 0;

    // Cash balance
    const openSession = await prisma.cashSession.findFirst({
      where: { shopId, status: 'open' },
      orderBy: { openedAt: 'desc' },
    });
    let cashBalance = openSession?.openingAmount ?? 0;
    if (openSession) {
      const movements = await prisma.cashMovement.findMany({
        where: { cashSessionId: openSession.id },
      });
      movements?.forEach?.((m: any) => {
        if (m?.type === 'entrada') cashBalance += m?.amount ?? 0;
        else cashBalance -= m?.amount ?? 0;
      });
    }

    // Low stock
    const allProducts = await prisma.product.findMany({ where: { shopId } });
    const lowStockProducts = (allProducts ?? [])?.filter?.((p: any) => (p?.quantity ?? 0) <= (p?.minQuantity ?? 0)) ?? [];

    // Recent orders
    const recentOrders = await prisma.serviceOrder.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } } },
    });

    return NextResponse.json({
      dailyRevenue,
      servicesCompleted,
      customersServed,
      cashBalance,
      lowStockProducts: (lowStockProducts ?? [])?.map?.((p: any) => ({
        id: p?.id,
        name: p?.name,
        quantity: p?.quantity ?? 0,
        minQuantity: p?.minQuantity ?? 0,
      })) ?? [],
      recentOrders: (recentOrders ?? [])?.map?.((o: any) => ({
        id: o?.id,
        orderNumber: o?.orderNumber ?? 0,
        customerName: o?.customer?.name ?? '',
        status: o?.status ?? '',
        totalCost: o?.totalCost ?? 0,
      })) ?? [],
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
