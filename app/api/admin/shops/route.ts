export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'superadmin') return null;
  return session;
}

export async function GET(req: Request) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ownerName: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const shops = await prisma.shop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        users: { take: 1, select: { email: true, name: true } },
        _count: { select: { customers: true, serviceOrders: true } },
      },
    });

    return NextResponse.json(shops);
  } catch (error: any) {
    console.error('Admin shops GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { shopName, ownerName, whatsapp, email, password, plan, planValue, dueDate } = body ?? {};

    if (!shopName || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const shop = await prisma.shop.create({
      data: {
        name: shopName,
        ownerName: ownerName ?? null,
        phone: whatsapp ?? null,
        plan: plan ?? 'Profissional',
        planValue: planValue ? parseFloat(planValue) : 149.90,
        status: 'Ativo',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await prisma.user.create({
      data: {
        name: ownerName ?? shopName,
        email,
        hashedPassword,
        role: 'admin',
        shopId: shop.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        shopId: shop.id,
        action: 'Criação',
        description: `Oficina "${shopName}" criada com plano ${plan ?? 'Profissional'}`,
      },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch (error: any) {
    console.error('Admin shop POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar oficina' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { id, action, ...data } = body ?? {};

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Oficina não encontrada' }, { status: 404 });

    // Status change actions
    if (action === 'activate') {
      const shop = await prisma.shop.update({ where: { id }, data: { status: 'Ativo' } });
      await prisma.activityLog.create({
        data: { shopId: id, action: 'Ativação', description: 'Acesso ativado' },
      });
      return NextResponse.json(shop);
    }

    if (action === 'overdue') {
      const shop = await prisma.shop.update({ where: { id }, data: { status: 'Atrasado' } });
      await prisma.activityLog.create({
        data: { shopId: id, action: 'Atraso', description: 'Marcada como atrasada' },
      });
      return NextResponse.json(shop);
    }

    if (action === 'block') {
      const shop = await prisma.shop.update({ where: { id }, data: { status: 'Bloqueado' } });
      await prisma.activityLog.create({
        data: { shopId: id, action: 'Bloqueio', description: 'Acesso bloqueado' },
      });
      return NextResponse.json(shop);
    }

    // General edit
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.ownerName !== undefined) updateData.ownerName = data.ownerName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.planValue !== undefined) updateData.planValue = parseFloat(data.planValue);
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.status !== undefined) updateData.status = data.status;

    const shop = await prisma.shop.update({ where: { id }, data: updateData });

    await prisma.activityLog.create({
      data: { shopId: id, action: 'Edição', description: 'Dados da oficina atualizados' },
    });

    return NextResponse.json(shop);
  } catch (error: any) {
    console.error('Admin shop PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
