import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { UserRole, UserStatus } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    status?: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      emailVerified?: Date | null;
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
  }
}

/**
 * Config Edge-compatible (pas de Prisma / Node APIs).
 * Utilisée par le proxy pour lire le JWT uniquement.
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
        if (!isLoggedIn || !isActive) {
          return false;
        }
        if (isAdmin) {
          const role = auth?.user?.role;
          return role === "admin" || role === "super_admin";
        }
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export type { JWT };
