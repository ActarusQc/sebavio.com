import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Next.js 16 : `middleware.ts` est déprécié au profit de `proxy.ts`.
 * Protection des routes via Auth.js (lecture JWT Edge-safe).
 *
 * Matcher : inclure `/admin` et `/dashboard` exacts + sous-routes.
 * Le callback `authorized` vérifie session+statut ; le RBAC admin
 * (rôle DB) est appliqué dans `app/admin/layout.tsx` et les guards.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
