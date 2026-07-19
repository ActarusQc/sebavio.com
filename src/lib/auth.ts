import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "@auth/core/adapters";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  AUTH_JWT_MAX_AGE_SECONDS,
  AUTH_JWT_UPDATE_AGE_SECONDS,
  type UserRole,
  type UserStatus,
} from "@/lib/constants";
import { EmailUnverifiedError } from "@/features/auth/errors";
import { authorizeCredentials } from "@/features/auth/services/authorize";
import { getUserStatusSnapshot } from "@/features/auth/services/user-status";
import { authConfig } from "@/lib/auth.config";

/**
 * Relecture DB : sessionVersion comparé à CHAQUE appel (révocation immédiate).
 * status/role/email rafraîchis au moins toutes les AUTH_JWT_UPDATE_AGE_SECONDS.
 */
async function refreshTokenStatus(token: JWT): Promise<JWT> {
  if (typeof token.id !== "string") {
    return token;
  }

  const snapshot = await getUserStatusSnapshot(token.id);
  token.statusCheckedAt = Date.now();

  if (!snapshot) {
    token.status = "deleted" as UserStatus;
    return token;
  }

  const tokenVersion =
    typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
  if (snapshot.sessionVersion !== tokenVersion) {
    // Sessions révoquées / MDP changé / rôle modifié — JWT invalide.
    token.status = "deleted" as UserStatus;
    token.sessionVersion = snapshot.sessionVersion;
    return token;
  }

  token.sessionVersion = snapshot.sessionVersion;
  token.role = snapshot.role;
  token.email = snapshot.email;
  token.status = snapshot.status;
  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: AUTH_JWT_MAX_AGE_SECONDS,
    updateAge: AUTH_JWT_UPDATE_AGE_SECONDS,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const forwarded = request?.headers?.get("x-forwarded-for");
        const ip =
          forwarded?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "unknown";

        try {
          const user = await authorizeCredentials(
            credentials?.email,
            credentials?.password,
            ip,
          );

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            status: user.status as UserStatus,
            sessionVersion: user.sessionVersion,
          };
        } catch (error) {
          if (error instanceof EmailUnverifiedError) {
            throw error;
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? undefined;
        token.role = user.role;
        token.status = user.status;
        token.sessionVersion =
          typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
        token.statusCheckedAt = Date.now();
        return token;
      }

      if (trigger === "update") {
        token.statusCheckedAt = 0;
      }

      return refreshTokenStatus(token);
    },
    async session({ session, token }) {
      if (
        session.user &&
        typeof token.id === "string" &&
        typeof token.email === "string" &&
        typeof token.role === "string" &&
        typeof token.status === "string"
      ) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.sessionVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      }
      return session;
    },
  },
});
