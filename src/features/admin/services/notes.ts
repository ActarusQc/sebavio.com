import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { hasPermission } from "@/lib/rbac";
import type { UserRole, UserStatus } from "@/lib/constants";
import type { AuthUser } from "@/features/auth/types";
import type {
  AdminNoteCategory,
  AdminNoteImportance,
  AdminUserNoteItem,
} from "@/features/admin/types";
import { sanitizeNoteContent } from "@/features/admin/lib/note-content";
import { assertActorCanActOnTarget } from "@/features/admin/services/roles-policy";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";

function assertCanManageNotes(actor: AuthUser): void {
  if (
    !hasPermission(actor.role, "users.notes") &&
    !hasPermission(actor.role, "users.notes.create")
  ) {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }
}

function toNoteItem(row: {
  id: string;
  userId: string;
  authorId: string;
  category: string;
  importance: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: { email: string } | null;
}): AdminUserNoteItem {
  return {
    id: row.id,
    userId: row.userId,
    authorId: row.authorId,
    authorEmail: row.author?.email ?? null,
    category: row.category as AdminNoteCategory,
    importance: row.importance as AdminNoteImportance,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const noteSelect = {
  id: true,
  userId: true,
  authorId: true,
  category: true,
  importance: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { email: true } },
} as const;

async function loadTargetOrThrow(userId: string) {
  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, status: true },
  });
  if (!target) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }
  return target;
}

export async function listAdminUserNotes(
  userId: string,
  actor: AuthUser,
): Promise<AdminUserNoteItem[]> {
  assertCanManageNotes(actor);
  const target = await loadTargetOrThrow(userId);
  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "notes",
  );

  const rows = await prisma.adminUserNote.findMany({
    where: { userId, deletedAt: null },
    select: noteSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return rows.map(toNoteItem);
}

export async function createAdminUserNote(
  userId: string,
  actor: AuthUser,
  input: {
    content: string;
    category: AdminNoteCategory;
    importance?: AdminNoteImportance;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  },
): Promise<AdminUserNoteItem> {
  assertCanManageNotes(actor);
  if (!hasPermission(actor.role, "users.notes.create")) {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }

  const target = await loadTargetOrThrow(userId);
  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "notes",
  );

  const content = sanitizeNoteContent(input.content);
  const importance = input.importance ?? "normal";

  const row = await prisma.adminUserNote.create({
    data: {
      userId,
      authorId: actor.id,
      category: input.category,
      importance,
      content,
    },
    select: noteSelect,
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "admin_user_notes",
    entityId: row.id,
    action: "USER_NOTE_CREATED",
    newValue: {
      userId,
      category: input.category,
      importance,
    },
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    requestId: input.requestId ?? null,
  });

  return toNoteItem(row);
}

export async function updateAdminUserNote(
  noteId: string,
  actor: AuthUser,
  input: {
    content?: string;
    category?: AdminNoteCategory;
    importance?: AdminNoteImportance;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  },
): Promise<AdminUserNoteItem> {
  assertCanManageNotes(actor);

  const existing = await prisma.adminUserNote.findFirst({
    where: { id: noteId, deletedAt: null },
    select: {
      id: true,
      userId: true,
      authorId: true,
      category: true,
      importance: true,
      content: true,
    },
  });

  if (!existing) {
    throw new AppError("ADM_003", "Note introuvable", 404);
  }

  const target = await loadTargetOrThrow(existing.userId);
  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "notes",
  );

  const data: {
    content?: string;
    category?: string;
    importance?: string;
  } = {};

  if (input.content !== undefined) {
    data.content = sanitizeNoteContent(input.content);
  }
  if (input.category !== undefined) data.category = input.category;
  if (input.importance !== undefined) data.importance = input.importance;

  if (Object.keys(data).length === 0) {
    throw new AppError("ADM_002", "Aucune modification fournie", 400);
  }

  const row = await prisma.adminUserNote.update({
    where: { id: noteId },
    data,
    select: noteSelect,
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "admin_user_notes",
    entityId: noteId,
    action: "USER_NOTE_UPDATED",
    oldValue: {
      category: existing.category,
      importance: existing.importance,
    },
    newValue: {
      category: row.category,
      importance: row.importance,
    },
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    requestId: input.requestId ?? null,
  });

  return toNoteItem(row);
}

export async function deleteAdminUserNote(
  noteId: string,
  actor: AuthUser,
  options: {
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
  } = {},
): Promise<void> {
  assertCanManageNotes(actor);

  const existing = await prisma.adminUserNote.findFirst({
    where: { id: noteId, deletedAt: null },
    select: { id: true, userId: true, category: true, importance: true },
  });

  if (!existing) {
    throw new AppError("ADM_003", "Note introuvable", 404);
  }

  const target = await loadTargetOrThrow(existing.userId);
  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "notes",
  );

  await prisma.adminUserNote.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "admin_user_notes",
    entityId: noteId,
    action: "USER_NOTE_DELETED",
    oldValue: {
      userId: existing.userId,
      category: existing.category,
      importance: existing.importance,
    },
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? null,
    requestId: options.requestId ?? null,
  });
}
