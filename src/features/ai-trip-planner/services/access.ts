import "server-only";

import { AppError } from "@/lib/errors";
import {
  assertFeatureAllowed,
  resolveUserAccess,
} from "@/features/subscriptions/services/access-resolve";
import { isAiFeatureEnabled } from "@/services/ai";

export type TripPlannerAccess = {
  canUse: boolean;
  aiEnabled: boolean;
  reason: string | null;
};

export async function resolveTripPlannerAccess(
  userId: string,
): Promise<TripPlannerAccess> {
  const aiEnabled = isAiFeatureEnabled();
  if (!aiEnabled) {
    return {
      canUse: false,
      aiEnabled: false,
      reason: "L’assistant de planification est temporairement indisponible.",
    };
  }

  try {
    await assertFeatureAllowed(userId, "ai.planning.enabled");
    return { canUse: true, aiEnabled: true, reason: null };
  } catch (error) {
    if (error instanceof AppError && error.code === "ACCESS_DENIED") {
      return {
        canUse: false,
        aiEnabled: true,
        reason:
          "La planification de voyage avec l’IA n’est pas incluse dans votre forfait actuel.",
      };
    }
    throw error;
  }
}

export async function assertTripPlannerAccess(userId: string): Promise<void> {
  const access = await resolveTripPlannerAccess(userId);
  if (!access.canUse) {
    throw new AppError(
      "ACCESS_DENIED",
      access.reason ??
        "La planification de voyage avec l’IA n’est pas disponible.",
      403,
    );
  }
  await resolveUserAccess(userId);
}
