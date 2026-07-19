import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  suspendAdminUser,
  reactivateAdminUser,
  getAdminUserById,
} from "../src/features/admin/services/users";
import {
  createAdminUserNote,
  listAdminUserNotes,
} from "../src/features/admin/services/notes";
import { revokeUserSessions } from "../src/features/admin/services/session-revoke";
import { adminSendPasswordReset } from "../src/features/admin/services/password-actions";
import type { AuthUser } from "../src/features/auth/types";

async function main() {
  const actorRow = await prisma.user.findFirst({
    where: { email: "daniel@sdgdigital.com" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      sessionVersion: true,
    },
  });
  const target = await prisma.user.findFirst({
    where: { email: "user@sebavio.local" },
    select: { id: true, sessionVersion: true },
  });
  if (!actorRow || !target) throw new Error("missing users");

  const actor = actorRow as AuthUser;
  const before = target.sessionVersion;

  const note = await createAdminUserNote(target.id, actor, {
    category: "support",
    importance: "normal",
    content: "Note phase2 verification auto",
  });
  console.log("NOTE", note.id);

  await suspendAdminUser(target.id, actor, {
    reason: "Test suspension phase 2 automatique",
  });
  console.log(
    "SUSPENDED",
    await prisma.user.findUnique({
      where: { id: target.id },
      select: { status: true, sessionVersion: true, suspensionReason: true },
    }),
  );

  await reactivateAdminUser(target.id, actor, {
    reason: "Test reactivation phase 2",
  });
  console.log(
    "REACTIVATED",
    await prisma.user.findUnique({
      where: { id: target.id },
      select: { status: true, sessionVersion: true },
    }),
  );

  await revokeUserSessions(target.id, actor, {
    reason: "Test revoke sessions phase 2",
  });
  const afterRev = await prisma.user.findUnique({
    where: { id: target.id },
    select: { sessionVersion: true },
  });
  console.log("REVOKED_VERSION", before, "->", afterRev?.sessionVersion);

  await adminSendPasswordReset(target.id, actor, {
    reason: "Test reset admin phase 2",
  });
  console.log("RESET_SENT_OK");

  const detail = await getAdminUserById(target.id);
  console.log("DETAIL_COUNTS", {
    trips: detail.tripCount,
    vehicles: detail.vehicleCount,
    notes: detail.notesCount,
  });

  const notes = await listAdminUserNotes(target.id);
  console.log("NOTES_COUNT", notes.length);

  const audits = await prisma.auditLog.findMany({
    where: { entityId: target.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { action: true, reason: true },
  });
  console.log("AUDITS", audits);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
