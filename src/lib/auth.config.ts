import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { UserRole, UserStatus } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    status?: UserStatus;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      emailVerified?: Date | null;
      sessionVersion?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    status?: UserStatus;
    email?: string;
    statusCheckedAt?: number;
    sessionVersion?: number;
  }
}

/**
 * Config Edge-compatible (pas de Prisma / Node APIs).
 * Utilisée par le proxy pour lire le JWT uniquement.
 *
 * Important — accès `/admin` :
 * le Proxy ne doit PAS autoriser/refuser selon `token.role` (souvent périmé
 * après une promotion en base). Il vérifie seulement session + statut actif.
 * La source de vérité RBAC reste `requireStaffUser` / `requirePermission`
 * (relecture PostgreSQL via `assertUserActive`).
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.email = user.email ?? undefined;
        token.role = user.role;
        token.status = user.status;
        token.sessionVersion =
          typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
      }
      return token;
    },
    session({ session, token }) {
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
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/verify-email");

      const isLoggedIn = Boolean(auth?.user?.id);
      const isActive = auth?.user?.status === "active";

      if (isAuthPage) {
        if (isLoggedIn && isActive) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      const isDashboard = pathname.startsWith("/dashboard");
      const isAdmin = pathname.startsWith("/admin");

      if (isDashboard || isAdmin) {
        // Session requise. Le rôle staff / RBAC se décide côté serveur (DB).
        return isLoggedIn && isActive;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export type { JWT };
