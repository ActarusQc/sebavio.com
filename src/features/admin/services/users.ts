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
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import { bumpSessionVersion } from "@/features/admin/services/session-revoke";
import { invalidateAdminDashboardCache } from "@/features/admin/services/dashboard";

type Tx = Prisma.TransactionClient;

/**
 * Verrouille toutes les lignes super_admin actives (SELECT … FOR UPDATE)
 * pour sérialiser suspension / rétrogradation concurrentes.
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

function requireReason(reason: string | undefined): string {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 3) {
    throw new AppError("ADM_002", "Motif requis (minimum 3 caractères)", 400);
  }
  return trimmed;
}

function toListItem(row: {
  id: string;
  email: string;
  status: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
  lastLoginAt?: Date | null;
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
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
  };
}

const userListSelect = {
  id: true,
  email: true,
  status: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  lastLoginAt: true,
  profile: { select: { firstName: true, lastName: true } },
  _count: {
    select: {
      vehicles: { where: { deletedAt: null } },
      trips: { where: { deletedAt: null } },
    },
  },
} as const;

/** Filtres liste / export CSV (hors pagination). */
export function buildAdminUserListWhere(
  query: Pick<
    AdminUserListQuery,
    | "q"
    | "status"
    | "role"
    | "emailVerified"
    | "createdFrom"
    | "createdTo"
    | "hasTrips"
    | "hasVehicles"
  >,
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  };

  if (query.status) where.status = query.status;
  if (query.role) where.role = query.role;

  if (query.emailVerified === true) {
    where.emailVerified = { not: null };
  } else if (query.emailVerified === false) {
    where.emailVerified = null;
  }

  if (query.createdFrom || query.createdTo) {
    where.createdAt = {};
    if (query.createdFrom) where.createdAt.gte = query.createdFrom;
    if (query.createdTo) where.createdAt.lte = query.createdTo;
  }

  if (query.hasTrips === true) {
    where.trips = { some: { deletedAt: null } };
  } else if (query.hasTrips === false) {
    where.trips = { none: { deletedAt: null } };
  }

  if (query.hasVehicles === true) {
    where.vehicles = { some: { deletedAt: null } };
  } else if (query.hasVehicles === false) {
    where.vehicles = { none: { deletedAt: null } };
  }

  if (query.q) {
    const q = query.q;
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { profile: { firstName: { contains: q, mode: "insensitive" } } },
      { profile: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrderBy(
  sort: AdminUserListQuery["sort"],
  order: AdminUserListQuery["order"],
): Prisma.UserOrderByWithRelationInput[] {
  const dir = order;
  const secondary: Prisma.UserOrderByWithRelationInput = { id: "asc" };

  switch (sort) {
    case "email":
      return [{ email: dir }, secondary];
    case "name":
      return [
        { profile: { firstName: dir } },
        { profile: { lastName: dir } },
        secondary,
      ];
    case "lastActivity":
      return [{ lastLoginAt: dir }, secondary];
    case "tripCount":
      return [{ trips: { _count: dir } }, secondary];
    case "createdAt":
    default:
      return [{ createdAt: dir }, secondary];
  }
}

export async function listAdminUsers(query: AdminUserListQuery): Promise<{
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const where = buildAdminUserListWhere(query);
  const orderBy = buildOrderBy(query.sort, query.order);

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy,
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
    select: {
      ...userListSelect,
      sessionVersion: true,
      passwordChangedAt: true,
      suspendedAt: true,
      suspensionReason: true,
      suspendedById: true,
      suspensionEndsAt: true,
      reactivatedAt: true,
      reactivatedById: true,
    },
  });

  if (!row) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  const [
    lastSession,
    activeSessionCount,
    notesCount,
    recentTrips,
    vehicles,
    activeSaCount,
  ] = await Promise.all([
    prisma.session.findFirst({
      where: { userId: id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.session.count({
      where: { userId: id, deletedAt: null },
    }),
    prisma.adminUserNote.count({
      where: { userId: id, deletedAt: null },
    }),
    prisma.trip.findMany({
      where: { userId: id, deletedAt: null },
      orderBy: [{ departureDate: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        departureDate: true,
        destination: true,
        createdAt: true,
      },
    }),
    prisma.userVehicle.findMany({
      where: { userId: id, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        nickname: true,
        licensePlate: true,
        manualManufacturerName: true,
        manualModelName: true,
        createdAt: true,
      },
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

  const lastActivityAt =
    lastSession?.updatedAt.toISOString() ??
    row.lastLoginAt?.toISOString() ??
    null;

  return {
    ...toListItem(row),
    lastActivityAt,
    isLastActiveSuperAdmin:
      row.role === "super_admin" &&
      row.status === "active" &&
      activeSaCount === 1,
    sessionVersion: row.sessionVersion,
    passwordChangedAt: row.passwordChangedAt?.toISOString() ?? null,
    suspendedAt: row.suspendedAt?.toISOString() ?? null,
    suspensionReason: row.suspensionReason,
    suspendedById: row.suspendedById,
    suspensionEndsAt: row.suspensionEndsAt?.toISOString() ?? null,
    reactivatedAt: row.reactivatedAt?.toISOString() ?? null,
    reactivatedById: row.reactivatedById,
    activeSessionCount,
    notesCount,
    recentTrips: recentTrips.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      departureDate: t.departureDate.toISOString(),
      destination: t.destination,
      createdAt: t.createdAt.toISOString(),
    })),
    vehicles: vehicles.map((v) => ({
      id: v.id,
      nickname: v.nickname,
      licensePlate: v.licensePlate,
      label:
        v.nickname?.trim() ||
        [v.manualManufacturerName, v.manualModelName]
          .filter(Boolean)
          .join(" ") ||
        null,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

export async function suspendAdminUser(
  targetId: string,
  actor: AuthUser,
  options: {
    reason: string;
    suspensionEndsAt?: Date | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  },
): Promise<AdminUserDetail> {
  const reason = requireReason(options.reason);

  if (
    options.suspensionEndsAt &&
    options.suspensionEndsAt.getTime() <= Date.now()
  ) {
    throw new AppError(
      "ADM_002",
      "La date de fin de suspension doit être dans le futur",
      400,
    );
  }

  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: { id: true, role: true, status: true, sessionVersion: true },
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

  const now = new Date();

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

    const nextVersion = await bumpSessionVersion(tx, targetId);

    await tx.session.updateMany({
      where: { userId: targetId, deletedAt: null },
      data: { deletedAt: now },
    });

    await tx.user.update({
      where: { id: targetId },
      data: {
        status: "suspended",
        suspendedAt: now,
        suspendedById: actor.id,
        suspensionReason: reason,
        suspensionEndsAt: options.suspensionEndsAt ?? null,
        reactivatedAt: null,
        reactivatedById: null,
      },
    });

    await writeAdminAuditLog(
      {
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "users",
        entityId: targetId,
        action: "USER_SUSPENDED",
        reason,
        oldValue: {
          status: target.status,
          role: target.role,
          sessionVersion: target.sessionVersion,
        },
        newValue: {
          status: "suspended",
          role: target.role,
          sessionVersion: nextVersion,
          suspensionEndsAt: options.suspensionEndsAt?.toISOString() ?? null,
        },
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        requestId: options.requestId ?? null,
      },
      tx,
    );
  });

  await invalidateAdminDashboardCache();
  return getAdminUserById(targetId);
}

export async function reactivateAdminUser(
  targetId: string,
  actor: AuthUser,
  options: {
    reason: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  },
): Promise<AdminUserDetail> {
  const reason = requireReason(options.reason);

  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: {
      id: true,
      role: true,
      status: true,
      sessionVersion: true,
      suspensionReason: true,
    },
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

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const nextVersion = await bumpSessionVersion(tx, targetId);

    await tx.session.updateMany({
      where: { userId: targetId, deletedAt: null },
      data: { deletedAt: now },
    });

    await tx.user.update({
      where: { id: targetId },
      data: {
        status: "active",
        suspendedAt: null,
        suspensionReason: null,
        suspendedById: null,
        suspensionEndsAt: null,
        reactivatedAt: now,
        reactivatedById: actor.id,
      },
    });

    await writeAdminAuditLog(
      {
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "users",
        entityId: targetId,
        action: "USER_REACTIVATED",
        reason,
        oldValue: {
          status: target.status,
          role: target.role,
          sessionVersion: target.sessionVersion,
          suspensionReason: target.suspensionReason,
        },
        newValue: {
          status: "active",
          role: target.role,
          sessionVersion: nextVersion,
        },
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        requestId: options.requestId ?? null,
      },
      tx,
    );
  });

  await invalidateAdminDashboardCache();
  return getAdminUserById(targetId);
}

export async function changeAdminUserRole(
  targetId: string,
  nextRole: UserRole,
  actor: AuthUser,
  options: {
    reason: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  },
): Promise<AdminUserDetail> {
  const reason = requireReason(options.reason);

  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: { id: true, role: true, status: true, sessionVersion: true },
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

  const now = new Date();

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

    const nextVersion = await bumpSessionVersion(tx, targetId);

    await tx.session.updateMany({
      where: { userId: targetId, deletedAt: null },
      data: { deletedAt: now },
    });

    await tx.user.update({
      where: { id: targetId },
      data: { role: nextRole },
    });

    await writeAdminAuditLog(
      {
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "users",
        entityId: targetId,
        action: "USER_ROLE_CHANGED",
        reason,
        oldValue: {
          role: target.role,
          status: target.status,
          sessionVersion: target.sessionVersion,
        },
        newValue: {
          role: nextRole,
          status: target.status,
          sessionVersion: nextVersion,
        },
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        requestId: options.requestId ?? null,
      },
      tx,
    );
  });

  await invalidateAdminDashboardCache();
  return getAdminUserById(targetId);
}
