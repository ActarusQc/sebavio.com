import { z } from "zod";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { estimateFuelCost, estimateTripFuel } from "@/features/fuel/services";
import { AppError } from "@/lib/errors";
import { isFdeEnabled } from "@/integrations/fde";
import { assertFdeRateLimit } from "@/services/fuel-prices";

/**
 * Estimation coût carburant.
 *
 * Modes :
 * - `{ tripId }` → charge distance / véhicule / départ côté serveur
 * - payload libre (distance + conso + carburant + position)
 *
 * Jamais de clé FDE exposée. Pas de SSRF : base URL uniquement via env serveur.
 */
const freeformSchema = z.object({
  distanceKm: z.number().finite().positive().max(20_000),
  consumptionLPer100Km: z.number().finite().positive().max(100),
  fuelType: z.enum([
    "regular",
    "premium",
    "diesel",
    "Gasoline",
    "Diesel",
    "Hybrid",
  ]),
  referencePosition: z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  }),
  radiusKm: z.number().finite().positive().max(50).optional(),
  tankCapacityL: z.number().finite().positive().min(10).max(500),
});

const tripSchema = z.object({
  tripId: z.string().uuid(),
  defaultPricePerLiter: z.number().finite().positive().optional(),
  consumptionL100: z.number().finite().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json().catch(() => ({}));

    if (
      body &&
      typeof body === "object" &&
      "tripId" in body &&
      body.tripId != null
    ) {
      const parsed = tripSchema.parse(body);
      const estimate = await estimateTripFuel(
        user.id,
        parsed.tripId,
        {
          defaultPricePerLiter: parsed.defaultPricePerLiter,
          consumptionL100: parsed.consumptionL100,
        },
        clientIp(request),
      );
      return jsonOk({ estimate });
    }

    const parsed = freeformSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Payload invalide",
        400,
      );
    }

    if (!isFdeEnabled()) {
      throw new AppError(
        "FDE_001",
        "Estimation libre nécessite FDE (activez FDE_ENABLED)",
        503,
      );
    }

    await assertFdeRateLimit(user.id);

    const result = await estimateFuelCost({
      distanceKm: parsed.data.distanceKm,
      consumptionLPer100Km: parsed.data.consumptionLPer100Km,
      fuelType: parsed.data.fuelType,
      referencePosition: parsed.data.referencePosition,
      radiusKm: parsed.data.radiusKm,
      tankCapacityL: parsed.data.tankCapacityL,
    });

    return jsonOk({
      distanceKm: result.distanceKm,
      estimatedLitres: result.estimatedLitres,
      priceCadPerLitre: result.priceCadPerLitre,
      estimatedCostCad: result.estimatedCostCad,
      currency: result.currency,
      fuelType: result.fuelType,
      pricingMethod: result.pricingMethod,
      stationCount: result.stationCount,
      fallbackUsed: result.fallbackUsed,
      observedAt: result.observedAt,
      freshness: result.freshness,
      source: result.source,
      attribution: result.attribution,
      granularity: result.granularity,
      warnings: result.warnings,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
