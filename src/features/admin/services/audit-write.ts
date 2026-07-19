import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/constants";

/** Clés jamais persistées dans old/new value d'audit. */
const SENSITIVE_KEY_PATTERN =
  /password|secret|token|api[_-]?key|authorization|credit.?card|card.?number|cvv|iban|ssn|master.?key/i;

function scrubValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(scrubValue);
  if (typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    out[key] = scrubValue(nested);
  }
  return out;
}

export function sanitizeAuditPayload(
  value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return scrubValue(value) as Prisma.InputJsonValue;
}

export type AdminAuditWriteInput = {
  actorUserId?: string | null;
  actorRole?: UserRole | "system" | null;
  entity: string;
  entityId?: string | null;
  action: string;
  reason?: string | null;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

/**
 * Journal d'audit admin — immutable, données sensibles caviardées.
 * Réutilise `audit_logs` (pas de table dupliquée).
 * `tx` optionnel pour écrire dans une transaction Prisma.
 */
export async function writeAdminAuditLog(
  input: AdminAuditWriteInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const db = tx ?? prisma;
  await db.auditLog.create({
    data: {
      userId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? null,
      entity: input.entity,
      entityId: input.entityId ?? null,
      action: input.action,
      reason: input.reason ?? null,
      oldValue: sanitizeAuditPayload(input.oldValue),
      newValue: sanitizeAuditPayload(input.newValue),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
    },
  });
}
