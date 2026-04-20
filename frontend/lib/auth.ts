import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginUser } from './api';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const res = await fetch(`${BACKEND}/api/v1/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: token.refreshToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Refresh failed');
    return {
      ...token,
      accessToken: data.access,
      // Rotate refresh token if Django returns a new one
      refreshToken: data.refresh ?? token.refreshToken,
      accessTokenExpiry: Date.now() + 60 * 60 * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshTokenError' };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const data = await loginUser(credentials.email, credentials.password);
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            accessToken: data.access,
            refreshToken: data.refresh,
            points: data.user.points,
            level: data.user.level,
            role: data.user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // First sign-in: seed all fields from the authorize() return value
      if (user) {
        return {
          ...token,
          id: user.id,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          accessTokenExpiry: Date.now() + 60 * 60 * 1000,
          points: (user as any).points,
          level: (user as any).level,
          role: (user as any).role,
        };
      }

      // Access token still valid — return as-is
      if (Date.now() < (token.accessTokenExpiry as number)) {
        return token;
      }

      // Access token expired — silently refresh it
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      (session.user as any).id = token.id;
      (session.user as any).points = token.points;
      (session.user as any).level = token.level;
      (session.user as any).role = token.role;
      return session;
    },
  },

  pages: { signIn: '/auth/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
