export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const { searchParams } = new URL(req.url);
    const type = searchParams?.get?.('type') ?? 'revenue';
    const period = searchParams?.get?.('period') ?? '30d';

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
    }

    if (type === 'revenue') {
      const orders = await prisma.serviceOrder.findMany({
        where: {
          shopId,
          status: 'Entregue',
          completedDate: { gte: startDate },
        },
        include: { customer: { select: { name: true } } },
        orderBy: { completedDate: 'desc' },
      });
      const totalFromOrders = orders.reduce((s: number, o: any) => s + (o.totalCost ?? 0), 0);

      // Revenue by day for the period
      const revenueByDay: Record<string, number> = {};
      orders.forEach((o: any) => {
        const day = (o.completedDate ?? o.updatedAt).toISOString().split('T')[0];
        revenueByDay[day] = (revenueByDay[day] ?? 0) + (o.totalCost ?? 0);
      });

      // Manual cash movements (entradas) for the period
      const manualMovements = await prisma.cashMovement.findMany({
        where: {
          shopId,
          type: 'entrada',
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter out OS-generated movements
      const manualOnly = manualMovements.filter((m: any) => !m.description?.startsWith('OS #'));
      const totalManual = manualOnly.reduce((s: number, m: any) => s + (m.amount ?? 0), 0);

      // Add manual to revenueByDay
      manualOnly.forEach((m: any) => {
        const day = m.createdAt.toISOString().split('T')[0];
        revenueByDay[day] = (revenueByDay[day] ?? 0) + (m.amount ?? 0);
      });

      // Revenue by payment method (orders + manual)
      const revenueByMethod: Record<string, number> = {};
      orders.forEach((o: any) => {
        const method = o.paymentMethod || 'Outros';
        revenueByMethod[method] = (revenueByMethod[method] ?? 0) + (o.totalCost ?? 0);
      });
      manualOnly.forEach((m: any) => {
        const method = m.paymentMethod || 'Outros';
        revenueByMethod[method] = (revenueByMethod[method] ?? 0) + (m.amount ?? 0);
      });

      const total = totalFromOrders + totalManual;

      return NextResponse.json({
        orders,
        manualMovements: manualOnly.map((m: any) => ({
          id: m.id,
          description: m.description,
          amount: m.amount,
          paymentMethod: m.paymentMethod,
          createdAt: m.createdAt,
        })),
        total,
        totalFromOrders,
        totalManual,
        revenueByDay,
        revenueByMethod,
        count: orders.length + manualOnly.length,
      });
    }

    if (type === 'services') {
      const orders = await prisma.serviceOrder.findMany({
        where: {
          shopId,
          entryDate: { gte: startDate },
        },
        include: { customer: { select: { name: true } } },
        orderBy: { entryDate: 'desc' },
      });
      const byStatus: Record<string, number> = {};
      orders.forEach((o: any) => {
        byStatus[o.status ?? 'Outros'] = (byStatus[o.status ?? 'Outros'] ?? 0) + 1;
      });

      // Payment methods breakdown
      const byPayment: Record<string, number> = {};
      orders.forEach((o: any) => {
        if (o.paymentMethod) {
          byPayment[o.paymentMethod] = (byPayment[o.paymentMethod] ?? 0) + 1;
        }
      });

      return NextResponse.json({ orders, byStatus, byPayment, total: orders.length });
    }

    if (type === 'lowstock') {
      const products = await prisma.product.findMany({ where: { shopId } });
      const low = products.filter((p: any) => (p.quantity ?? 0) <= (p.minQuantity ?? 0));
      return NextResponse.json({ products: low, total: low.length });
    }

    if (type === 'overview') {
      const [totalOrders, completedOrders, totalCustomers, totalProducts] = await Promise.all([
        prisma.serviceOrder.count({ where: { shopId, entryDate: { gte: startDate } } }),
        prisma.serviceOrder.count({ where: { shopId, status: 'Entregue', completedDate: { gte: startDate } } }),
        prisma.customer.count({ where: { shopId } }),
        prisma.product.count({ where: { shopId } }),
      ]);

      const revenue = await prisma.serviceOrder.findMany({
        where: { shopId, status: 'Entregue', completedDate: { gte: startDate } },
        select: { totalCost: true },
      });
      const revenueFromOrders = revenue.reduce((s: number, o: any) => s + (o.totalCost ?? 0), 0);

      // Include manual cash entries in overview
      const manualMovements = await prisma.cashMovement.findMany({
        where: {
          shopId,
          type: 'entrada',
          createdAt: { gte: startDate },
        },
      });
      const manualOnly = manualMovements.filter((m: any) => !m.description?.startsWith('OS #'));
      const revenueFromManual = manualOnly.reduce((s: number, m: any) => s + (m.amount ?? 0), 0);

      const totalRevenue = revenueFromOrders + revenueFromManual;
      const avgTicket = completedOrders > 0 ? revenueFromOrders / completedOrders : 0;

      return NextResponse.json({
        totalOrders,
        completedOrders,
        totalCustomers,
        totalProducts,
        totalRevenue,
        avgTicket,
        revenueFromManual,
      });
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
