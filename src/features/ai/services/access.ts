import "server-only";

import { AppError } from "@/lib/errors";
import {
  assertFeatureAllowed,
  resolveUserAccess,
  type UserAccessSnapshot,
} from "@/features/subscriptions";
import type { TripAssistantRequestType } from "@/features/ai/schemas/request";
import { requestTypeNeedsRecommendations } from "@/features/ai/lib/request-types";

export type TripAssistantAccess = {
  access: UserAccessSnapshot;
  canUsePersonalizedAi: boolean;
  canUseRecommendations: boolean;
};

export async function resolveTripAssistantAccess(
  userId: string,
): Promise<TripAssistantAccess> {
  const access = await resolveUserAccess(userId);
  const planning = access.entitlements.find(
    (e) => e.key === "ai.planning.enabled",
  );
  const recommendations = access.entitlements.find(
    (e) => e.key === "ai.recommendations.enabled",
  );

  return {
    access,
    canUsePersonalizedAi:
      Boolean(planning?.enabled) || access.level === "admin",
    canUseRecommendations:
      Boolean(recommendations?.enabled) || access.level === "admin",
  };
}

export async function assertTripAssistantEntitlements(
  userId: string,
  requestType: TripAssistantRequestType,
): Promise<TripAssistantAccess> {
  await assertFeatureAllowed(userId, "ai.planning.enabled");

  if (requestTypeNeedsRecommendations(requestType)) {
    await assertFeatureAllowed(userId, "ai.recommendations.enabled");
  }

  return resolveTripAssistantAccess(userId);
}

export function assertRecommendationsAllowed(
  access: TripAssistantAccess,
): void {
  if (!access.canUseRecommendations) {
    throw new AppError(
      "ACCESS_DENIED",
      "Les recommandations IA ne sont pas incluses dans votre forfait.",
      403,
    );
  }
}

export { requestTypeNeedsRecommendations } from "@/features/ai/lib/request-types";
