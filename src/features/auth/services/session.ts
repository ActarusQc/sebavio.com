import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertUserActive } from "@/features/auth/services/user-status";
import { isAdminRole } from "@/features/auth/services/roles";
import type { AuthUser } from "@/features/auth/types";

/** Session JWT + re-vérification status en base (mutations / admin). */
export async function requireActiveUser(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("AUTH_006", "Accès refusé", 401);
  }
  return assertUserActive(session.user.id);
}

export async function requireAdminUser(): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (!isAdminRole(user.role)) {
    throw new AppError("AUTH_006", "Accès refusé", 403);
  }
  return user;
}
