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

    const openSession = await prisma.cashSession.findFirst({
      where: { shopId, status: 'open' },
      orderBy: { openedAt: 'desc' },
      include: {
        movements: { orderBy: { createdAt: 'desc' } },
      },
    });

    const closedSessions = await prisma.cashSession.findMany({
      where: { shopId, status: 'closed' },
      orderBy: { closedAt: 'desc' },
      take: 10,
      include: { movements: { orderBy: { createdAt: 'desc' } } },
    });

    let balance = openSession?.openingAmount ?? 0;
    let totalEntradas = 0;
    let totalSaidas = 0;
    const byMethod: Record<string, { entradas: number; saidas: number }> = {};
    (openSession?.movements ?? [])?.forEach?.((m: any) => {
      const method = m?.paymentMethod || 'Outros';
      if (!byMethod[method]) byMethod[method] = { entradas: 0, saidas: 0 };
      if (m?.type === 'entrada') {
        balance += m?.amount ?? 0;
        totalEntradas += m?.amount ?? 0;
        byMethod[method].entradas += m?.amount ?? 0;
      } else {
        balance -= m?.amount ?? 0;
        totalSaidas += m?.amount ?? 0;
        byMethod[method].saidas += m?.amount ?? 0;
      }
    });

    return NextResponse.json({
      session: openSession,
      balance,
      totalEntradas,
      totalSaidas,
      byMethod,
      closedSessions,
    });
  } catch (error: any) {
    console.error('Cash GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const body = await req.json();
    const { action } = body ?? {};

    if (action === 'open') {
      const existing = await prisma.cashSession.findFirst({
        where: { shopId, status: 'open' },
      });
      if (existing) return NextResponse.json({ error: 'Já existe um caixa aberto' }, { status: 400 });

      const cs = await prisma.cashSession.create({
        data: {
          openingAmount: body?.openingAmount ?? 0,
          shopId,
        },
      });
      return NextResponse.json(cs, { status: 201 });
    }

    if (action === 'close') {
      const openSession = await prisma.cashSession.findFirst({
        where: { shopId, status: 'open' },
        include: { movements: true },
      });
      if (!openSession) return NextResponse.json({ error: 'Nenhum caixa aberto' }, { status: 400 });

      let expected = openSession?.openingAmount ?? 0;
      (openSession?.movements ?? [])?.forEach?.((m: any) => {
        if (m?.type === 'entrada') expected += m?.amount ?? 0;
        else expected -= m?.amount ?? 0;
      });

      const closingAmount = body?.closingAmount ?? 0;
      const difference = closingAmount - expected;

      const updated = await prisma.cashSession.update({
        where: { id: openSession.id },
        data: {
          status: 'closed',
          closedAt: new Date(),
          closingAmount,
          expectedAmount: expected,
          difference,
        },
      });

      return NextResponse.json(updated);
    }

    if (action === 'movement') {
      const openSession = await prisma.cashSession.findFirst({
        where: { shopId, status: 'open' },
      });
      if (!openSession) return NextResponse.json({ error: 'Abra o caixa primeiro' }, { status: 400 });

      // Handle product items for stock deduction
      const items = body?.items ?? [];

      const movement = await prisma.cashMovement.create({
        data: {
          type: body?.type ?? 'entrada',
          amount: body?.amount ?? 0,
          description: body?.description ?? '',
          paymentMethod: body?.paymentMethod ?? null,
          cashSessionId: openSession.id,
          shopId,
        },
      });

      // Deduct stock for each product item
      for (const item of items) {
        if (item?.productId && item?.quantity > 0) {
          try {
            await prisma.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
            await prisma.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'saida',
                quantity: item.quantity,
                reason: `Venda via caixa - ${body?.description ?? 'Movimento'}`,
              },
            });
          } catch (err) {
            console.error('Stock deduction error for product:', item.productId, err);
          }
        }
      }

      return NextResponse.json(movement, { status: 201 });
    }

    if (action === 'reopen') {
      const sessionId = body?.sessionId;
      if (!sessionId) return NextResponse.json({ error: 'ID da sessão obrigatório' }, { status: 400 });

      // Check if there's already an open session
      const existing = await prisma.cashSession.findFirst({
        where: { shopId, status: 'open' },
      });
      if (existing) return NextResponse.json({ error: 'Já existe um caixa aberto. Feche-o antes de reabrir outro.' }, { status: 400 });

      const target = await prisma.cashSession.findFirst({
        where: { id: sessionId, shopId, status: 'closed' },
      });
      if (!target) return NextResponse.json({ error: 'Sessão não encontrada ou já aberta' }, { status: 404 });

      const reopened = await prisma.cashSession.update({
        where: { id: sessionId },
        data: {
          status: 'open',
          closedAt: null,
          closingAmount: null,
          expectedAmount: null,
          difference: null,
        },
      });
      return NextResponse.json(reopened);
    }

    if (action === 'delete') {
      const sessionId = body?.sessionId;
      if (!sessionId) return NextResponse.json({ error: 'ID da sessão obrigatório' }, { status: 400 });

      const target = await prisma.cashSession.findFirst({
        where: { id: sessionId, shopId },
      });
      if (!target) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });

      // Delete movements first, then the session
      await prisma.cashMovement.deleteMany({ where: { cashSessionId: sessionId } });
      await prisma.cashSession.delete({ where: { id: sessionId } });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Cash POST error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
