import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminAuditQuery } from "@/features/admin/schemas";
import type { AdminAuditLogItem } from "@/features/admin/types";

export async function listAdminAuditLogs(query: AdminAuditQuery): Promise<{
  items: AdminAuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.userId) where.userId = query.userId;
  if (query.entity) where.entity = query.entity;
  if (query.action) where.action = query.action;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = query.from;
    if (query.to) where.createdAt.lte = query.to;
  }

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        userId: true,
        entity: true,
        entityId: true,
        action: true,
        oldValue: true,
        newValue: true,
        ipAddress: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userEmail: row.user?.email ?? null,
      entity: row.entity,
      entityId: row.entityId,
      action: row.action,
      oldValue: row.oldValue,
      newValue: row.newValue,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
