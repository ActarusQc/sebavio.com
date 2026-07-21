import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type {
  FuelPriceLookupInput,
  FuelPriceProvider,
  FuelPriceQuote,
} from "./types";

const DEFAULT_SAMPLE_LIMIT = 20;

/**
 * Prix = moyenne des derniers `price_per_liter` des pleins de l'utilisateur.
 * Sans historique → `defaultPricePerLiter` (sinon EXT_004).
 */
export class PersonalAverageFuelPriceProvider implements FuelPriceProvider {
  async getPricePerLiter(input: FuelPriceLookupInput): Promise<FuelPriceQuote> {
    const limit = input.sampleLimit ?? DEFAULT_SAMPLE_LIMIT;

    const logs = await prisma.fuelLog.findMany({
      where: {
        deletedAt: null,
        vehicle: { userId: input.userId, deletedAt: null },
      },
      orderBy: [{ filledAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: { pricePerLiter: true },
    });

    if (logs.length > 0) {
      const sum = logs.reduce((acc, row) => acc + Number(row.pricePerLiter), 0);
      const avg = Math.round((sum / logs.length) * 1000) / 1000;
      return {
        pricePerLiter: avg,
        source: "personal_average",
        sampleCount: logs.length,
        currency: "CAD",
        label: `Prix moyen de vos ${logs.length} derniers pleins`,
      };
    }

    const fallback = input.defaultPricePerLiter;
    if (fallback == null || !Number.isFinite(fallback) || fallback <= 0) {
      throw new AppError(
        "EXT_004",
        "Aucun prix de carburant disponible pour ce point de départ.",
        404,
      );
    }

    return {
      pricePerLiter: Math.round(fallback * 1000) / 1000,
      source: "user_default",
      sampleCount: 0,
      currency: "CAD",
      label: "Prix par défaut saisi",
    };
  }
}
