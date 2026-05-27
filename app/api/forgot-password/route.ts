export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MotoGestor Pro <onboarding@resend.dev>',
            to: [user.email],
            subject: 'Recuperação de senha - MotoGestor Pro',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Recuperação de senha</h2>
                <p>Olá, ${user.name}!</p>
                <p>Você solicitou a recuperação de senha. Clique no botão abaixo para redefinir:</p>
                <a href="${resetUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
                  Redefinir senha
                </a>
                <p style="color: #666; font-size: 14px;">Este link expira em 1 hora. Se não foi você, ignore este email.</p>
              </div>
            `,
          }),
        });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
