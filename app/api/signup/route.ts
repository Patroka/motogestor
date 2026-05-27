export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, shopName } = body ?? {};
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }
    const finalShopName = shopName || `Oficina de ${name}`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const shop = await prisma.shop.create({
      data: { name: finalShopName },
    });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: 'admin',
        shopId: shop.id,
      },
    });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
