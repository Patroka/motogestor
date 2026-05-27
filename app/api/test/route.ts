import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    return NextResponse.json({ ok: true, db: process.env.DATABASE_URL?.substring(0,30) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: e.errorCode }, { status: 500 });
  }
}
