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
    const lowOnly = searchParams?.get?.('lowOnly') === 'true';
    const brand = searchParams?.get?.('brand') ?? '';
    const model = searchParams?.get?.('model') ?? '';

    const barcode = searchParams?.get?.('barcode') ?? '';

    // Barcode exact lookup — returns single product
    if (barcode) {
      const product = await prisma.product.findFirst({ where: { barcode, shopId } });
      if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      return NextResponse.json(product);
    }

    const where: any = { shopId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { barcode: { equals: search } },
      ];
    }

    let products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Sort by compatible motorcycles (compatible first, then others)
    if (brand || model) {
      products.sort((a: any, b: any) => {
        const isCompatible = (p: any) => {
          if (!p.compatibleMotorcycles) return false;
          try {
            const compat = JSON.parse(p.compatibleMotorcycles);
            if (!Array.isArray(compat)) return false;
            return compat.some((c: any) => {
              if (brand && c.brand !== brand) return false;
              if (model && Array.isArray(c.models) && !c.models.includes(model)) return false;
              return true;
            });
          } catch { return false; }
        };
        const aCompat = isCompatible(a) ? 0 : 1;
        const bCompat = isCompatible(b) ? 0 : 1;
        return aCompat - bCompat;
      });
    }

    const result = lowOnly
      ? products.filter((p: any) => (p?.quantity ?? 0) <= (p?.minQuantity ?? 0))
      : products;

    return NextResponse.json(result ?? []);
  } catch (error: any) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const body = await req.json();

    const product = await prisma.product.create({
      data: {
        name: body?.name ?? '',
        barcode: body?.barcode || null,
        description: body?.description ?? null,
        category: body?.category ?? null,
        compatibleMotorcycles: body?.compatibleMotorcycles ?? null,
        quantity: body?.quantity ?? 0,
        minQuantity: body?.minQuantity ?? 5,
        costPrice: body?.costPrice ?? 0,
        salePrice: body?.salePrice ?? 0,
        shopId,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Product POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const shopId = (session.user as any)?.shopId;
    const body = await req.json();
    const { id, stockAction, stockQuantity, stockReason, ...data } = body ?? {};

    const existing = await prisma.product.findFirst({ where: { id, shopId } });
    if (!existing) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

    // Stock movement
    if (stockAction === 'entrada' || stockAction === 'saida') {
      const qty = parseInt(stockQuantity) || 0;
      if (qty <= 0) return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 });

      if (stockAction === 'saida' && qty > (existing.quantity ?? 0)) {
        return NextResponse.json({ error: 'Quantidade de saída maior que estoque disponível' }, { status: 400 });
      }

      const newQty = stockAction === 'entrada'
        ? (existing.quantity ?? 0) + qty
        : (existing.quantity ?? 0) - qty;

      await prisma.stockMovement.create({
        data: {
          productId: id,
          type: stockAction,
          quantity: qty,
          reason: stockReason ?? null,
        },
      });

      const updated = await prisma.product.update({
        where: { id },
        data: { quantity: newQty },
      });

      return NextResponse.json(updated);
    }

    // Regular update
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data?.name ?? existing.name,
        barcode: data?.barcode !== undefined ? (data.barcode || null) : existing.barcode,
        description: data?.description !== undefined ? data.description : existing.description,
        category: data?.category ?? existing.category,
        compatibleMotorcycles: data?.compatibleMotorcycles !== undefined ? data.compatibleMotorcycles : existing.compatibleMotorcycles,
        quantity: data?.quantity ?? existing.quantity,
        minQuantity: data?.minQuantity ?? existing.minQuantity,
        costPrice: data?.costPrice ?? existing.costPrice,
        salePrice: data?.salePrice ?? existing.salePrice,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
