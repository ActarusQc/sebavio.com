import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  NEAREST_STATION_RADIUS_KM,
  REGIE_MAX_AGE_MS,
  formatRelativeFr,
  haversineKm,
  mapVehicleFuelToRegie,
  type RegieFuelType,
} from "./constants";
import type { FuelPriceLookupInput, FuelPriceQuote } from "../types";

export type LatLng = { lat: number; lng: number };

export type RegieLookupInput = FuelPriceLookupInput & {
  points?: LatLng[];
  regions?: string[];
  vehicleFuelType?: string | null;
  /** Override type Régie (tests). */
  regieFuelType?: RegieFuelType;
};

async function latestGlobalCapturedAt(): Promise<Date | null> {
  const row = await prisma.fuelPrice.findFirst({
    orderBy: { capturedAt: "desc" },
    select: { capturedAt: true },
  });
  return row?.capturedAt ?? null;
}

async function resolveRegionsFromPoints(points: LatLng[]): Promise<string[]> {
  if (points.length === 0) return [];

  const stations = await prisma.fuelStation.findMany({
    where: {
      deletedAt: null,
      region: { not: null },
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      region: true,
      latitude: true,
      longitude: true,
    },
  });

  const regions = new Set<string>();
  for (const point of points) {
    let best: { region: string; km: number } | null = null;
    for (const s of stations) {
      if (s.region == null || s.latitude == null || s.longitude == null) {
        continue;
      }
      const km = haversineKm(
        point.lat,
        point.lng,
        Number(s.latitude),
        Number(s.longitude),
      );
      if (km > NEAREST_STATION_RADIUS_KM) continue;
      if (!best || km < best.km) {
        best = { region: s.region, km };
      }
    }
    if (best) regions.add(best.region);
  }
  return [...regions];
}

async function averageRegionalPrice(
  regions: string[],
  fuelType: RegieFuelType,
): Promise<{ avg: number; sampleCount: number; capturedAt: Date } | null> {
  if (regions.length === 0) return null;

  const rows = await prisma.$queryRaw<
    Array<{ price: number; captured_at: Date }>
  >`
    SELECT p.price::float8 AS price, p.captured_at
    FROM (
      SELECT DISTINCT ON (fp.station_id)
        fp.station_id, fp.price, fp.captured_at
      FROM fuel_prices fp
      INNER JOIN fuel_stations fs ON fs.id = fp.station_id
      WHERE fs.deleted_at IS NULL
        AND fs.region IN (${Prisma.join(regions)})
        AND fp.fuel_type = ${fuelType}
      ORDER BY fp.station_id, fp.captured_at DESC
    ) p
  `;

  if (rows.length === 0) return null;
  const sum = rows.reduce((a, r) => a + Number(r.price), 0);
  const avg = Math.round((sum / rows.length) * 1000) / 1000;
  const capturedAt = rows.reduce(
    (max, r) => (r.captured_at > max ? r.captured_at : max),
    rows[0]!.captured_at,
  );
  return { avg, sampleCount: rows.length, capturedAt };
}

/**
 * Prix moyen régional (Régie). Retourne null si hors QC / données stale / N/A.
 * Ne lève jamais d'erreur bloquante.
 */
export class RegieQuebecFuelPriceProvider {
  async getPricePerLiter(
    input: RegieLookupInput,
  ): Promise<FuelPriceQuote | null> {
    const mapped =
      input.regieFuelType ??
      mapVehicleFuelToRegie(input.vehicleFuelType ?? null);

    if (mapped === "not_applicable") {
      return {
        pricePerLiter: 0,
        source: "not_applicable",
        sampleCount: 0,
        currency: "CAD",
        label: "Carburant non applicable (véhicule électrique / rechargeable)",
      };
    }
    if (mapped == null) {
      return null;
    }

    const latest = await latestGlobalCapturedAt();
    if (!latest) return null;
    if (Date.now() - latest.getTime() > REGIE_MAX_AGE_MS) return null;

    let regions = (input.regions ?? []).filter(Boolean);
    if (regions.length === 0 && input.points?.length) {
      regions = await resolveRegionsFromPoints(input.points);
    }
    if (regions.length === 0) return null;

    const avg = await averageRegionalPrice(regions, mapped);
    if (!avg) return null;

    const regionLabel =
      regions.length === 1
        ? regions[0]!
        : `${regions.length} régions (${regions.slice(0, 2).join(", ")}${regions.length > 2 ? "…" : ""})`;

    return {
      pricePerLiter: avg.avg,
      source: "regie_quebec",
      sampleCount: avg.sampleCount,
      currency: "CAD",
      regionLabel,
      capturedAt: avg.capturedAt.toISOString(),
      label: `Prix moyen région ${regionLabel}, source Régie de l'énergie, relevé ${formatRelativeFr(avg.capturedAt)}`,
    };
  }
}

/** Variante typée pour le composite (peut retourner null). */
export async function tryRegieQuote(
  input: RegieLookupInput,
): Promise<FuelPriceQuote | null> {
  return new RegieQuebecFuelPriceProvider().getPricePerLiter(input);
}
