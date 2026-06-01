import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.toLowerCase().trim();
        try {
          // First check AdminUser table
          const admin = await prisma.adminUser.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          });
          if (admin) {
            const isValid = await bcrypt.compare(credentials.password, admin.hashedPassword);
            if (!isValid) {
              console.log('[AUTH] Admin found but password mismatch for:', normalizedEmail);
              return null;
            }
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              shopId: null,
              shopName: 'Administrador',
              role: 'superadmin',
            } as any;
          }

          // Then check User table
          const user = await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
            include: { shop: true },
          });
          if (!user) {
            console.log('[AUTH] No user found for email:', normalizedEmail);
            return null;
          }
          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (!isValid) {
            console.log('[AUTH] User found but password mismatch for:', normalizedEmail, '| hashedPassword length:', user.hashedPassword?.length);
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            shopId: user.shopId,
            shopName: user?.shop?.name ?? '',
            role: user.role,
          };
        } catch (err) {
          console.error('[AUTH] Authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.shopId = user?.shopId;
        token.shopName = user?.shopName;
        token.role = user?.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        (session.user as any).id = token?.sub;
        (session.user as any).shopId = token?.shopId;
        (session.user as any).shopName = token?.shopName;
        (session.user as any).role = token?.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
