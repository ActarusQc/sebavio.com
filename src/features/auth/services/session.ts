import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertUserActive } from "@/features/auth/services/user-status";
import { isAdminRole } from "@/features/auth/services/roles";
import { hasPermission, type AdminPermission } from "@/lib/rbac";
import type { AuthUser } from "@/features/auth/types";

/**
 * Log d'accès admin — uniquement si ADMIN_ACCESS_DEBUG=true.
 * Jamais de cookie, JWT, secret ni mot de passe.
 */
function logAdminAccessDebug(payload: {
  userId: string | null;
  databaseRole: string | null;
  jwtRole: string | null;
  sessionRole: string | null;
  requiredPermission: string | null;
  redirectSource: string;
  redirectDestination: string | null;
}): void {
  if (process.env.ADMIN_ACCESS_DEBUG !== "true") return;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEBAVIO_ENV === "production"
  ) {
    return;
  }
  console.info("[admin-access]", JSON.stringify(payload));
}

/** Session JWT + re-vérification status/rôle en base (mutations / admin). */
export async function requireActiveUser(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("AUTH_006", "Accès refusé", 401);
  }
  return assertUserActive(session.user.id);
}

/**
 * Tout rôle staff avec `admin.portal`.
 * Source de vérité : rôle actuel en PostgreSQL (pas le JWT).
 */
export async function requireStaffUser(): Promise<AuthUser> {
  const session = await auth();
  const jwtRole =
    typeof session?.user?.role === "string" ? session.user.role : null;

  if (!session?.user?.id) {
    logAdminAccessDebug({
      userId: null,
      databaseRole: null,
      jwtRole,
      sessionRole: jwtRole,
      requiredPermission: "admin.portal",
      redirectSource: "requireStaffUser",
      redirectDestination: "/login",
    });
    throw new AppError("AUTH_006", "Accès refusé", 401);
  }

  const user = await assertUserActive(session.user.id);

  if (!hasPermission(user.role, "admin.portal")) {
    logAdminAccessDebug({
      userId: user.id,
      databaseRole: user.role,
      jwtRole,
      sessionRole: jwtRole,
      requiredPermission: "admin.portal",
      redirectSource: "requireStaffUser",
      redirectDestination: "/forbidden",
    });
    throw new AppError("ADM_001", "Accès refusé", 403);
  }

  if (process.env.ADMIN_ACCESS_DEBUG === "true") {
    logAdminAccessDebug({
      userId: user.id,
      databaseRole: user.role,
      jwtRole,
      sessionRole: jwtRole,
      requiredPermission: "admin.portal",
      redirectSource: "requireStaffUser",
      redirectDestination: null,
    });
  }

  return user;
}

/**
 * Permission fine — à appeler dans chaque Server Action / Route Handler sensible.
 * Rôle lu en base via `assertUserActive`, indépendamment d'un JWT périmé.
 */
export async function requirePermission(
  permission: AdminPermission,
): Promise<AuthUser> {
  const session = await auth();
  const jwtRole =
    typeof session?.user?.role === "string" ? session.user.role : null;

  if (!session?.user?.id) {
    throw new AppError("AUTH_006", "Accès refusé", 401);
  }

  const user = await assertUserActive(session.user.id);

  if (!hasPermission(user.role, permission)) {
    logAdminAccessDebug({
      userId: user.id,
      databaseRole: user.role,
      jwtRole,
      sessionRole: jwtRole,
      requiredPermission: permission,
      redirectSource: "requirePermission",
      redirectDestination: "/forbidden",
    });
    throw new AppError("ADM_001", "Accès refusé", 403);
  }

  return user;
}

/**
 * Admin contenu (catalogue / campings / activités) — `content.manage`.
 * Conservé pour les routes historiques `requireAdminUser`.
 */
export async function requireAdminUser(): Promise<AuthUser> {
  return requirePermission("content.manage");
}

export async function requireSuperAdminUser(): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (user.role !== "super_admin") {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }
  return user;
}

/** @deprecated Préférer `requireStaffUser` — alias de compatibilité. */
export async function requireAnyAdminUser(): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (!isAdminRole(user.role)) {
    throw new AppError("AUTH_006", "Accès refusé", 403);
  }
  return user;
}
