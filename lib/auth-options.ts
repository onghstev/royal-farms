import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Lazy Prisma client - only instantiated when getAuthOptions() is called at runtime
let _prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// CRITICAL: Export a function that returns authOptions, not the options directly
// This prevents PrismaAdapter from being evaluated at build time
export function getAuthOptions(): NextAuthOptions {
  const prisma = getPrisma();
  
  return {
    adapter: PrismaAdapter(prisma),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        allowDangerousEmailAccountLinking: true,
      }),
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please enter your email and password');
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { role: true },
          });

          if (!user || !user?.isActive) {
            throw new Error('No active user found with this email');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            role: user.role?.name || 'User',
            roleId: user.roleId,
          };
        },
      }),
    ],
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60,
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = (user as any).role;
          token.roleId = (user as any).roleId;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).role = token.role;
          (session.user as any).roleId = token.roleId;
        }
        return session;
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
  };
}

// For backward compatibility with getServerSession calls in other files
// These only use authOptions at runtime, not build time, so this is safe
export const authOptions = {
  get adapter() { return getAuthOptions().adapter; },
  get providers() { return getAuthOptions().providers; },
  get session() { return getAuthOptions().session; },
  get callbacks() { return getAuthOptions().callbacks; },
  get pages() { return getAuthOptions().pages; },
  get secret() { return getAuthOptions().secret; },
  get debug() { return getAuthOptions().debug; },
} as NextAuthOptions;
