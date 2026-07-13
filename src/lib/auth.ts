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
import { authorizeCredentials } from "@/features/auth/services/authorize";
import { getUserStatusSnapshot } from "@/features/auth/services/user-status";
import { authConfig } from "@/lib/auth.config";

/** Intervalle max entre deux relectures status en base via le JWT callback. */
const STATUS_RECHECK_MS = AUTH_JWT_UPDATE_AGE_SECONDS * 1000;

async function refreshTokenStatus(token: JWT): Promise<JWT> {
  if (typeof token.id !== "string") {
    return token;
  }

  const checkedAt =
    typeof token.statusCheckedAt === "number" ? token.statusCheckedAt : 0;
  const shouldRecheck = Date.now() - checkedAt >= STATUS_RECHECK_MS;

  if (!shouldRecheck && token.status) {
    return token;
  }

  const snapshot = await getUserStatusSnapshot(token.id);
  token.statusCheckedAt = Date.now();

  if (!snapshot || snapshot.status !== "active") {
    token.status = (snapshot?.status ?? "deleted") as UserStatus;
    if (snapshot) {
      token.role = snapshot.role;
      token.email = snapshot.email;
    }
    return token;
  }

  token.status = snapshot.status;
  token.role = snapshot.role;
  token.email = snapshot.email;
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
        };
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
        token.statusCheckedAt = Date.now();
        return token;
      }

      if (trigger === "update") {
        token.statusCheckedAt = 0;
      }

      return refreshTokenStatus(token);
    },
  },
});
