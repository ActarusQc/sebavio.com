import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  entity: string;
  entityId?: string | null;
  action: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

/** Journalise une opération d'auth — jamais de mot de passe ni de jeton brut. */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      entity: input.entity,
      entityId: input.entityId ?? null,
      action: input.action,
      oldValue: input.oldValue,
      newValue: input.newValue,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
