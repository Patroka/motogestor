export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'superadmin') return null;
  return session;
}

export async function POST(req: Request) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { shopId, action, amount, method, notes, dueDate } = body ?? {};

    if (!shopId) return NextResponse.json({ error: 'shopId obrigatório' }, { status: 400 });

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Oficina não encontrada' }, { status: 404 });

    if (action === 'markPaid') {
      const payment = await prisma.paymentHistory.create({
        data: {
          shopId,
          amount: amount ?? shop.planValue,
          status: 'Pago',
          method: method ?? null,
          notes: notes ?? null,
          dueDate: shop.dueDate,
          paidAt: new Date(),
        },
      });

      // Update shop: set next due date (+30 days) and last payment
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);

      await prisma.shop.update({
        where: { id: shopId },
        data: {
          status: 'Ativo',
          lastPayment: new Date(),
          dueDate: nextDue,
        },
      });

      await prisma.activityLog.create({
        data: {
          shopId,
          action: 'Pagamento',
          description: `Pagamento de R$ ${(amount ?? shop.planValue).toFixed(2)} registrado via ${method ?? 'N/A'}`,
        },
      });

      return NextResponse.json(payment, { status: 201 });
    }

    if (action === 'markOverdue') {
      await prisma.shop.update({ where: { id: shopId }, data: { status: 'Atrasado' } });
      await prisma.activityLog.create({
        data: { shopId, action: 'Atraso', description: 'Pagamento marcado como atrasado' },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'updateDueDate') {
      if (!dueDate) return NextResponse.json({ error: 'Data obrigatória' }, { status: 400 });
      await prisma.shop.update({ where: { id: shopId }, data: { dueDate: new Date(dueDate) } });
      await prisma.activityLog.create({
        data: { shopId, action: 'Vencimento', description: `Vencimento atualizado para ${new Date(dueDate).toLocaleDateString('pt-BR')}` },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'block') {
      await prisma.shop.update({ where: { id: shopId }, data: { status: 'Bloqueado' } });
      await prisma.activityLog.create({
        data: { shopId, action: 'Bloqueio', description: 'Acesso bloqueado por falta de pagamento' },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin payment error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
