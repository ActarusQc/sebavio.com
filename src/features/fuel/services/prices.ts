import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const querySchema = z.object({
  region: z.string().trim().min(1).max(120).optional(),
  fuelType: z.enum(["regular", "premium", "diesel"]).default("regular"),
});

export type RegionalFuelPriceDto = {
  region: string;
  fuelType: string;
  avgPricePerLiter: string;
  sampleCount: number;
  capturedAt: string | null;
  currency: "CAD";
  source: "regie_quebec";
};

/**
 * GET /api/v1/fuel/prices — moyenne des prix courants par région.
 */
export async function listRegionalFuelPrices(
  rawQuery: Record<string, string | undefined>,
): Promise<{ items: RegionalFuelPriceDto[] }> {
  const parsed = querySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Paramètres invalides",
      400,
    );
  }

  const { region, fuelType } = parsed.data;

  const all = await prisma.$queryRaw<
    Array<{
      region: string;
      avg_price: number;
      sample_count: bigint;
      captured_at: Date | null;
    }>
  >`
    SELECT
      fs.region AS region,
      AVG(p.price)::float8 AS avg_price,
      COUNT(*)::bigint AS sample_count,
      MAX(p.captured_at) AS captured_at
    FROM (
      SELECT DISTINCT ON (fp.station_id)
        fp.station_id, fp.price, fp.captured_at, fp.fuel_type
      FROM fuel_prices fp
      WHERE fp.fuel_type = ${fuelType}
      ORDER BY fp.station_id, fp.captured_at DESC
    ) p
    INNER JOIN fuel_stations fs ON fs.id = p.station_id
    WHERE fs.deleted_at IS NULL
      AND fs.region IS NOT NULL
    GROUP BY fs.region
    ORDER BY fs.region ASC
  `;

  const filtered = region ? all.filter((r) => r.region === region) : all;

  return {
    items: filtered.map((r) => ({
      region: r.region,
      fuelType,
      avgPricePerLiter: Number(r.avg_price).toFixed(3),
      sampleCount: Number(r.sample_count),
      capturedAt: r.captured_at?.toISOString() ?? null,
      currency: "CAD" as const,
      source: "regie_quebec" as const,
    })),
  };
}
