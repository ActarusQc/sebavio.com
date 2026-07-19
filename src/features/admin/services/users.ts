import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { UserRole, UserStatus } from "@/lib/constants";
import type { AuthUser } from "@/features/auth/types";
import type { AdminUserListQuery } from "@/features/admin/schemas";
import type {
  AdminUserDetail,
  AdminUserListItem,
} from "@/features/admin/types";
import {
  assertActorCanActOnTarget,
  assertActorCanAssignRole,
  assertNotLastActiveSuperAdmin,
  removesActiveSuperAdminPrivilege,
} from "@/features/admin/services/roles-policy";
import { invalidateAdminDashboardCache } from "@/features/admin/services/dashboard";

type Tx = Prisma.TransactionClient;

/**
 * Verrouille toutes les lignes super_admin actives (SELECT … FOR UPDATE)
 * pour sérialiser suspension / rétrogradation concurrentes.
 * Deux super_admins qui se suspendent mutuellement : le 2e voit COUNT=1
 * après le commit du 1er et est refusé.
 */
async function lockActiveSuperAdmins(tx: Tx): Promise<void> {
  await tx.$queryRaw`
    SELECT id
    FROM users
    WHERE role = 'super_admin'
      AND status = 'active'
      AND deleted_at IS NULL
    FOR UPDATE
  `;
}

async function countActiveSuperAdmins(tx: Tx): Promise<number> {
  return tx.user.count({
    where: {
      role: "super_admin",
      status: "active",
      deletedAt: null,
    },
  });
}

function toListItem(row: {
  id: string;
  email: string;
  status: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
  profile: { firstName: string; lastName: string } | null;
  _count: { vehicles: number; trips: number };
}): AdminUserListItem {
  return {
    id: row.id,
    email: row.email,
    status: row.status as UserStatus,
    role: row.role as UserRole,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    emailVerified: row.emailVerified?.toISOString() ?? null,
    firstName: row.profile?.firstName || null,
    lastName: row.profile?.lastName || null,
    vehicleCount: row._count.vehicles,
    tripCount: row._count.trips,
  };
}

const userSelect = {
  id: true,
  email: true,
  status: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  profile: { select: { firstName: true, lastName: true } },
  _count: {
    select: {
      vehicles: { where: { deletedAt: null } },
      trips: { where: { deletedAt: null } },
    },
  },
} as const;

export async function listAdminUsers(query: AdminUserListQuery): Promise<{
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  };

  if (query.status) where.status = query.status;
  if (query.role) where.role = query.role;
  if (query.q) {
    const q = query.q;
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { profile: { firstName: { contains: q, mode: "insensitive" } } },
      { profile: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getAdminUserById(id: string): Promise<AdminUserDetail> {
  const row = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: userSelect,
  });

  if (!row) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  const [lastSession, activeSaCount] = await Promise.all([
    prisma.session.findFirst({
      where: { userId: id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    row.role === "super_admin" && row.status === "active"
      ? prisma.user.count({
          where: {
            role: "super_admin",
            status: "active",
            deletedAt: null,
          },
        })
      : Promise.resolve(0),
  ]);

  return {
    ...toListItem(row),
    lastActivityAt: lastSession?.updatedAt.toISOString() ?? null,
    isLastActiveSuperAdmin:
      row.role === "super_admin" &&
      row.status === "active" &&
      activeSaCount === 1,
  };
}

export async function suspendAdminUser(
  targetId: string,
  actor: AuthUser,
  options: { reason?: string; ipAddress?: string | null } = {},
): Promise<AdminUserDetail> {
  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: { id: true, role: true, status: true },
  });

  if (!target) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "suspend",
  );

  if (target.status === "suspended") {
    throw new AppError("ADM_002", "Compte déjà suspendu", 400);
  }

  if (target.status !== "active") {
    throw new AppError("ADM_002", "Statut utilisateur invalide", 400);
  }

  const needsLock = removesActiveSuperAdminPrivilege(
    {
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    { status: "suspended" },
  );

  await prisma.$transaction(async (tx) => {
    if (needsLock) {
      await lockActiveSuperAdmins(tx);
      const count = await countActiveSuperAdmins(tx);
      assertNotLastActiveSuperAdmin(
        count,
        {
          role: target.role as UserRole,
          status: target.status as UserStatus,
        },
        { status: "suspended" },
      );
    }

    await tx.user.update({
      where: { id: targetId },
      data: { status: "suspended" },
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        actorRole: actor.role,
        entity: "users",
        entityId: targetId,
        action: "ADMIN_SUSPEND",
        reason: options.reason ?? null,
        oldValue: { status: target.status, role: target.role },
        newValue: {
          status: "suspended",
          role: target.role,
        },
        ipAddress: options.ipAddress ?? null,
      },
    });
  });

  await invalidateAdminDashboardCache();
  return getAdminUserById(targetId);
}

export async function reactivateAdminUser(
  targetId: string,
  actor: AuthUser,
  options: { ipAddress?: string | null } = {},
): Promise<AdminUserDetail> {
  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: { id: true, role: true, status: true },
  });

  if (!target) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "reactivate",
  );

  if (target.status !== "suspended") {
    throw new AppError("ADM_002", "Compte non suspendu", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetId },
      data: { status: "active" },
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        actorRole: actor.role,
        entity: "users",
        entityId: targetId,
        action: "ADMIN_REACTIVATE",
        oldValue: { status: target.status, role: target.role },
        newValue: { status: "active", role: target.role },
        ipAddress: options.ipAddress ?? null,
      },
    });
  });

  await invalidateAdminDashboardCache();
  return getAdminUserById(targetId);
}

export async function changeAdminUserRole(
  targetId: string,
  nextRole: UserRole,
  actor: AuthUser,
  options: { ipAddress?: string | null } = {},
): Promise<AdminUserDetail> {
  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: { id: true, role: true, status: true },
  });

  if (!target) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  assertActorCanAssignRole(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    nextRole,
  );

  if (target.role === nextRole) {
    throw new AppError("ADM_002", "Rôle déjà assigné", 400);
  }

  const needsLock = removesActiveSuperAdminPrivilege(
    {
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    { role: nextRole },
  );

  await prisma.$transaction(async (tx) => {
    if (needsLock) {
      await lockActiveSuperAdmins(tx);
      const count = await countActiveSuperAdmins(tx);
      assertNotLastActiveSuperAdmin(
        count,
        {
          role: target.role as UserRole,
          status: target.status as UserStatus,
        },
        { role: nextRole },
      );
    }

    await tx.user.update({
      where: { id: targetId },
      data: { role: nextRole },
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        actorRole: actor.role,
        entity: "users",
        entityId: targetId,
        action: "ADMIN_CHANGE_ROLE",
        reason: null,
        oldValue: { role: target.role, status: target.status },
        newValue: { role: nextRole, status: target.status },
        ipAddress: options.ipAddress ?? null,
      },
    });
  });

  await invalidateAdminDashboardCache();
  return getAdminUserById(targetId);
}
