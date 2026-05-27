// This route is no longer needed - admin uses the same auth system
// Kept as empty file to avoid 404
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.redirect(new URL('/api/auth/providers', 'http://localhost:3000')); }
export async function POST() { return NextResponse.redirect(new URL('/api/auth/providers', 'http://localhost:3000')); }
