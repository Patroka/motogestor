export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Link inválido ou expirado. Solicite um novo link.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('[RESET-PASSWORD] Password updated for user:', updated.email, '| id:', updated.id, '| hashedPassword length:', hashedPassword.length);

    // Verify the hash works immediately
    const verifyOk = await bcrypt.compare(password, hashedPassword);
    console.log('[RESET-PASSWORD] Hash verify immediately after update:', verifyOk);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
