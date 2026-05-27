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

export async function GET() {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const configs = await prisma.systemConfig.findMany();
    const result: Record<string, string> = {};
    configs.forEach((c: any) => { result[c.key] = c.value; });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await req.json();

    for (const [key, value] of Object.entries(body ?? {})) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Config POST error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
