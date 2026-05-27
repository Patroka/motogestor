export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) return NextResponse.json({ status: 'Ativo' });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { status: true },
    });

    return NextResponse.json({ status: shop?.status ?? 'Ativo' });
  } catch {
    return NextResponse.json({ status: 'Ativo' });
  }
}
