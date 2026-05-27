import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  }

  // Shop routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/ordens') ||
    pathname.startsWith('/estoque') ||
    pathname.startsWith('/caixa') ||
    pathname.startsWith('/relatorios') ||
    pathname.startsWith('/configuracoes')
  ) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check if shop is blocked
    if (token.role !== 'superadmin' && token.shopId) {
      try {
        const baseUrl = req.nextUrl.origin;
        const res = await fetch(`${baseUrl}/api/shop-status?shopId=${token.shopId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.status === 'Bloqueado') {
            return NextResponse.redirect(new URL('/blocked', req.url));
          }
        }
      } catch {
        // If check fails, allow access
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clientes/:path*',
    '/ordens/:path*',
    '/estoque/:path*',
    '/caixa/:path*',
    '/relatorios/:path*',
    '/configuracoes/:path*',
    '/admin/:path*',
  ],
};
