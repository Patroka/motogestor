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
    const search = searchParams?.get?.('search') ?? '';

    const customers = await prisma.customer.findMany({
      where: {
        shopId,
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { plate: { contains: search } },
          ],
        } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        serviceOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalCost: true,
            laborCost: true,
            partsCost: true,
            description: true,
            partsUsed: true,
            paymentMethod: true,
            entryDate: true,
            items: {
              select: {
                description: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(customers ?? []);
  } catch (error: any) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const body = await req.json();

    const customer = await prisma.customer.create({
      data: {
        name: body?.name ?? '',
        phone: body?.phone ?? null,
        motorcycle: body?.motorcycle ?? null,
        model: body?.model ?? null,
        plate: body?.plate ?? null,
        observations: body?.observations ?? null,
        shopId,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Customer POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const body = await req.json();
    const { id, ...data } = body ?? {};

    const existing = await prisma.customer.findFirst({ where: { id, shopId } });
    if (!existing) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data?.name ?? existing.name,
        phone: data?.phone ?? existing.phone,
        motorcycle: data?.motorcycle ?? existing.motorcycle,
        model: data?.model ?? existing.model,
        plate: data?.plate ?? existing.plate,
        observations: data?.observations ?? existing.observations,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Customer PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
