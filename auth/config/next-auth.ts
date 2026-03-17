/**
 * NextAuth config for Google and GitHub OAuth. Creates/links users in Neon PostgreSQL.
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { query } from "@/database/db";

const hasGoogle = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET
);

const hasGitHub = !!(
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET
);

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
    ...(hasGitHub
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
              params: {
                scope: "read:user user:email",
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        const email = (profile.email ?? user.email)?.trim()?.toLowerCase();
        if (!email) return false;
        const googleVerified = (profile as { email_verified?: boolean }).email_verified === true;
        if (!googleVerified) return false;
        const googleId = (profile as { sub?: string }).sub ?? account.providerAccountId;
        const name = (profile.name ?? user.name) ?? null;
        const avatarUrl = (profile as { picture?: string }).picture ?? user.image ?? null;
        const existing = await query<{ id: string; status: string | null }>(
          `SELECT id, COALESCE(status, 'active') as status FROM users WHERE lower(email) = $1`,
          [email]
        );
        const row = existing.rows[0];
        if (row) {
          if (row.status === "blocked" || row.status === "shadow_banned") return false;
          await query(
            `UPDATE users SET google_id = $1, provider = 'google', avatar_url = COALESCE(avatar_url, $2) WHERE id = $3`,
            [googleId, avatarUrl, row.id]
          );
        } else {
          await query(
            `INSERT INTO users (email, name, password_hash, provider, google_id, avatar_url)
             VALUES ($1, $2, NULL, 'google', $3, $4)`,
            [email, name, googleId, avatarUrl]
          );
        }
        return true;
      }

      if (account?.provider === "github" && profile) {
        const email = (profile.email ?? (profile as { emails?: { email: string }[] }).emails?.[0]?.email ?? user.email)?.trim()?.toLowerCase();
        if (!email) return false;
        const githubId = String((profile as { id?: number }).id ?? account.providerAccountId ?? "");
        if (!githubId) return false;
        const name = (profile.name ?? (profile as { login?: string }).login ?? user.name) ?? null;
        const avatarUrl = (profile as { avatar_url?: string }).avatar_url ?? user.image ?? null;
        const existing = await query<{ id: string; status: string | null }>(
          `SELECT id, COALESCE(status, 'active') as status FROM users WHERE lower(email) = $1`,
          [email]
        );
        const row = existing.rows[0];
        if (row) {
          if (row.status === "blocked" || row.status === "shadow_banned") return false;
          await query(
            `UPDATE users SET github_id = $1, provider = 'github', avatar_url = COALESCE(avatar_url, $2) WHERE id = $3`,
            [githubId, avatarUrl, row.id]
          );
        } else {
          await query(
            `INSERT INTO users (email, name, password_hash, provider, github_id, avatar_url)
             VALUES ($1, $2, NULL, 'github', $3, $4)`,
            [email, name, githubId, avatarUrl]
          );
        }
        return true;
      }

      return true;
    },
    async jwt({ token, user: nextAuthUser, account }) {
      if ((account?.provider === "google" || account?.provider === "github") && nextAuthUser?.email) {
        const res = await query<{ id: string }>(
          `SELECT id FROM users WHERE lower(email) = $1`,
          [nextAuthUser.email.trim().toLowerCase()]
        );
        const dbUser = res.rows[0];
        if (dbUser) {
          token.ourUserId = dbUser.id;
          token.email = nextAuthUser.email;
          token.name = nextAuthUser.name ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.ourUserId && session.user) {
        (session.user as { id: string }).id = token.ourUserId;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name = token.name ?? session.user.name ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface Session {
    user: { id?: string; email?: string | null; name?: string | null; image?: string | null };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    ourUserId?: string;
    email?: string | null;
    name?: string | null;
  }
}
