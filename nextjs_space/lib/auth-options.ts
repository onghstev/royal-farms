import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
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
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.name,
          roleId: user.roleId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // For OAuth users, fetch or create role information
        if (account?.provider === 'google') {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { role: true },
          });

          if (dbUser) {
            // If user exists with a role, use it
            if (dbUser.role) {
              token.role = dbUser.role.name;
              token.roleId = dbUser.roleId;
            } else {
              // Assign default Worker role to OAuth users without a role
              const workerRole = await prisma.role.findFirst({
                where: { name: 'Worker' },
              });
              if (workerRole) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { roleId: workerRole.id },
                });
                token.role = workerRole.name;
                token.roleId = workerRole.id;
              }
            }
          }
        } else {
          // For credentials provider, role is already in user object
          token.role = (user as any).role;
          token.roleId = (user as any).roleId;
        }
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
