import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { hasPermission } from "@/lib/rbac";
import type { AuthUser } from "@/features/auth/types";
import type { AdminUserListQuery } from "@/features/admin/schemas";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/constants";
import { csvCell } from "@/features/admin/lib/csv";
import { buildAdminUserListWhere } from "@/features/admin/services/users";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";

export const ADMIN_USER_EXPORT_MAX_ROWS = 5000;

export type AdminUserExportQuery = Omit<
  AdminUserListQuery,
  "page" | "pageSize"
>;

export type AdminUserExportResult = {
  csv: string;
  rowCount: number;
  truncated: boolean;
};

/**
 * Export CSV des utilisateurs (filtres liste, max 5000 lignes).
 * Permission `users.export`.
 */
export async function exportAdminUsersCsv(
  query: AdminUserExportQuery,
  actor: AuthUser,
  options: {
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  } = {},
): Promise<AdminUserExportResult> {
  if (!hasPermission(actor.role, "users.export")) {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }

  const where = buildAdminUserListWhere(query);
  const dir = query.order;
  const secondary = { id: "asc" as const };

  let orderBy;
  switch (query.sort) {
    case "email":
      orderBy = [{ email: dir }, secondary];
      break;
    case "name":
      orderBy = [
        { profile: { firstName: dir } },
        { profile: { lastName: dir } },
        secondary,
      ];
      break;
    case "lastActivity":
      orderBy = [{ lastLoginAt: dir }, secondary];
      break;
    case "tripCount":
      orderBy = [{ trips: { _count: dir } }, secondary];
      break;
    case "createdAt":
    default:
      orderBy = [{ createdAt: dir }, secondary];
      break;
  }

  const rows = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      status: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      lastLoginAt: true,
      profile: { select: { firstName: true, lastName: true } },
      _count: {
        select: {
          vehicles: { where: { deletedAt: null } },
          trips: { where: { deletedAt: null } },
        },
      },
    },
    orderBy,
    take: ADMIN_USER_EXPORT_MAX_ROWS + 1,
  });

  const truncated = rows.length > ADMIN_USER_EXPORT_MAX_ROWS;
  const exportRows = truncated
    ? rows.slice(0, ADMIN_USER_EXPORT_MAX_ROWS)
    : rows;

  const header = [
    "id",
    "email",
    "first_name",
    "last_name",
    "status",
    "role",
    "email_verified",
    "created_at",
    "last_login_at",
    "trip_count",
    "vehicle_count",
  ].join(",");

  const lines = exportRows.map((row) =>
    [
      csvCell(row.id),
      csvCell(row.email),
      csvCell(row.profile?.firstName ?? ""),
      csvCell(row.profile?.lastName ?? ""),
      csvCell(STATUS_LABELS[row.status] ?? row.status),
      csvCell(ROLE_LABELS[row.role] ?? row.role),
      csvCell(row.emailVerified ? "oui" : "non"),
      csvCell(row.createdAt.toISOString()),
      csvCell(row.lastLoginAt?.toISOString() ?? ""),
      csvCell(row._count.trips),
      csvCell(row._count.vehicles),
    ].join(","),
  );

  const csv = [header, ...lines].join("\r\n");

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "users",
    entityId: null,
    action: "USER_LIST_EXPORTED",
    reason: null,
    newValue: {
      rowCount: exportRows.length,
      truncated,
      filters: {
        q: query.q ?? null,
        status: query.status ?? null,
        role: query.role ?? null,
        emailVerified: query.emailVerified ?? null,
        hasTrips: query.hasTrips ?? null,
        hasVehicles: query.hasVehicles ?? null,
        sort: query.sort,
        order: query.order,
      },
    },
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? null,
    requestId: options.requestId ?? null,
  });

  return {
    csv,
    rowCount: exportRows.length,
    truncated,
  };
}
