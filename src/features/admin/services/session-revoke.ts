import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { hasPermission } from "@/lib/rbac";
import type { UserRole, UserStatus } from "@/lib/constants";
import type { AuthUser } from "@/features/auth/types";
import { assertActorCanActOnTarget } from "@/features/admin/services/roles-policy";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";

type Tx = Prisma.TransactionClient;

/** Incrémente `sessionVersion` (invalide les JWT portant l'ancienne version). */
export async function bumpSessionVersion(
  tx: Tx,
  userId: string,
): Promise<number> {
  const updated = await tx.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return updated.sessionVersion;
}

export type RevokeSessionsOptions = {
  reason: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  /** Autorise un admin à révoquer ses propres sessions (confirmation côté action). */
  allowSelf?: boolean;
};

/**
 * Invalide toutes les sessions DB + bump sessionVersion.
 * Soft-delete des lignes `sessions` (deletedAt = now).
 */
export async function revokeUserSessions(
  targetId: string,
  actor: AuthUser,
  options: RevokeSessionsOptions,
): Promise<{ sessionVersion: number }> {
  const reason = options.reason?.trim();
  if (!reason || reason.length < 3) {
    throw new AppError("ADM_002", "Motif requis (minimum 3 caractères)", 400);
  }

  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: { id: true, role: true, status: true, sessionVersion: true },
  });

  if (!target) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  const isSelf = actor.id === targetId;

  if (isSelf) {
    if (!options.allowSelf) {
      throw new AppError(
        "ADM_004",
        "Action non autorisée sur votre propre compte",
        403,
      );
    }
    if (!hasPermission(actor.role, "users.sessions.revoke")) {
      throw new AppError("ADM_001", "Accès refusé", 403);
    }
  } else {
    assertActorCanActOnTarget(
      { id: actor.id, role: actor.role },
      {
        id: target.id,
        role: target.role as UserRole,
        status: target.status as UserStatus,
      },
      "revoke_sessions",
    );
  }

  const sessionVersion = await prisma.$transaction(async (tx) => {
    const nextVersion = await bumpSessionVersion(tx, targetId);

    await tx.session.updateMany({
      where: { userId: targetId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await writeAdminAuditLog(
      {
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "users",
        entityId: targetId,
        action: "USER_SESSIONS_REVOKED",
        reason,
        oldValue: { sessionVersion: target.sessionVersion },
        newValue: { sessionVersion: nextVersion, self: isSelf },
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        requestId: options.requestId ?? null,
      },
      tx,
    );

    return nextVersion;
  });

  return { sessionVersion };
}
