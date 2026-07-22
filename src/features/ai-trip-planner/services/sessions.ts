import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  ACTIVE_SESSION_STATUSES,
  INITIAL_QUICK_REPLIES,
  SESSION_RETENTION_DAYS,
  WELCOME_MESSAGE,
} from "@/features/ai-trip-planner/constants";
import { emptyTripDraft } from "@/features/ai-trip-planner/schemas/draft";
import type { PlannerMessageStored } from "@/features/ai-trip-planner/schemas/session";
import { toSessionDto } from "@/features/ai-trip-planner/services/dto";
import { assertTripPlannerAccess } from "@/features/ai-trip-planner/services/access";
import { loadPlannerUserContext } from "@/features/ai-trip-planner/services/user-context";
import type { TripPlannerSessionDto } from "@/features/ai-trip-planner/types";
import type { Prisma } from "@prisma/client";

async function withUserExtras(
  userId: string,
  session: Parameters<typeof toSessionDto>[0],
): Promise<TripPlannerSessionDto> {
  const ctx = await loadPlannerUserContext(userId);
  const { listVehicles } =
    await import("@/features/vehicles/services/vehicles");
  let ownedVehicles: Array<{ id: string; label: string }> = [];
  try {
    const page = await listVehicles(userId, { pageSize: "20" });
    ownedVehicles = page.items.map((v) => ({
      id: v.id,
      label: v.displayName?.trim() || v.nickname?.trim() || "Véhicule",
    }));
  } catch {
    ownedVehicles = [];
  }
  return toSessionDto(session, {
    originSuggestions: ctx.originSuggestions,
    homeCity: ctx.homeCity,
    ownedVehicles,
  });
}

function welcomeMessages(): PlannerMessageStored[] {
  return [
    {
      id: randomUUID(),
      role: "assistant",
      content: WELCOME_MESSAGE,
      createdAt: new Date().toISOString(),
      quickReplies: [...INITIAL_QUICK_REPLIES],
    },
  ];
}

export async function getOwnedSessionOrThrow(
  userId: string,
  sessionId: string,
) {
  const session = await prisma.aiTripPlanningSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) {
    throw new AppError("AI_001", "Session de planification introuvable.", 404);
  }
  return session;
}

export async function getActiveSession(userId: string) {
  return prisma.aiTripPlanningSession.findFirst({
    where: {
      userId,
      status: { in: [...ACTIVE_SESSION_STATUSES] },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createSession(
  userId: string,
  options?: { forceNew?: boolean },
): Promise<TripPlannerSessionDto> {
  await assertTripPlannerAccess(userId);

  if (!options?.forceNew) {
    const existing = await getActiveSession(userId);
    if (existing) return withUserExtras(userId, existing);
  } else {
    await prisma.aiTripPlanningSession.updateMany({
      where: {
        userId,
        status: { in: [...ACTIVE_SESSION_STATUSES] },
      },
      data: { status: "abandoned" },
    });
  }

  const created = await prisma.aiTripPlanningSession.create({
    data: {
      userId,
      status: "collecting",
      messages: welcomeMessages() as unknown as Prisma.InputJsonValue,
      structuredDraft: emptyTripDraft() as unknown as Prisma.InputJsonValue,
    },
  });

  return withUserExtras(userId, created);
}

export async function abandonSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const session = await getOwnedSessionOrThrow(userId, sessionId);
  if (session.status === "created") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cette planification a déjà créé un voyage et ne peut pas être abandonnée ainsi.",
      400,
    );
  }
  await prisma.aiTripPlanningSession.update({
    where: { id: session.id },
    data: { status: "abandoned" },
  });
}

export async function restartSession(
  userId: string,
  sessionId: string,
): Promise<TripPlannerSessionDto> {
  await abandonSession(userId, sessionId);
  return createSession(userId, { forceNew: true });
}

/** Nettoyage best-effort des sessions incomplètes anciennes. */
export async function cleanupStaleSessions(userId?: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - SESSION_RETENTION_DAYS);

  const result = await prisma.aiTripPlanningSession.updateMany({
    where: {
      ...(userId ? { userId } : {}),
      status: { in: [...ACTIVE_SESSION_STATUSES] },
      updatedAt: { lt: cutoff },
    },
    data: { status: "abandoned" },
  });

  return result.count;
}
