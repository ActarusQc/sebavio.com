/**
 * Calculs de consommation (L/100 km) — métier pur, sans I/O.
 */

export type FuelLogForConsumption = {
  odometerKm: number;
  liters: number;
  isFull: boolean;
};

export type ConsumptionSegment = {
  fromOdometer: number;
  toOdometer: number;
  distanceKm: number;
  liters: number;
  litersPer100Km: number;
};

export type ConsumptionStats = {
  /** null si moins de 2 pleins complets */
  realAvgConsumption: number | null;
  segmentCount: number;
  totalDistanceKm: number;
  totalLitersInSegments: number;
  segments: ConsumptionSegment[];
};

/**
 * Segments entre pleins complets consécutifs (ordre odomètre croissant).
 * Les pleins partiels sont ignorés pour la conso.
 * Distance ≤ 0 → segment exclu (cas limite : même odomètre).
 */
export function computeConsumptionStats(
  logs: FuelLogForConsumption[],
): ConsumptionStats {
  const full = logs
    .filter((l) => l.isFull)
    .slice()
    .sort((a, b) => a.odometerKm - b.odometerKm);

  const segments: ConsumptionSegment[] = [];

  for (let i = 1; i < full.length; i++) {
    const prev = full[i - 1]!;
    const curr = full[i]!;
    const distanceKm = curr.odometerKm - prev.odometerKm;
    if (distanceKm <= 0) continue;
    if (curr.liters <= 0) continue;

    const litersPer100Km = (curr.liters / distanceKm) * 100;
    segments.push({
      fromOdometer: prev.odometerKm,
      toOdometer: curr.odometerKm,
      distanceKm,
      liters: curr.liters,
      litersPer100Km,
    });
  }

  if (segments.length === 0) {
    return {
      realAvgConsumption: null,
      segmentCount: 0,
      totalDistanceKm: 0,
      totalLitersInSegments: 0,
      segments,
    };
  }

  const totalDistanceKm = segments.reduce((s, x) => s + x.distanceKm, 0);
  const totalLitersInSegments = segments.reduce((s, x) => s + x.liters, 0);
  const realAvgConsumption =
    totalDistanceKm > 0
      ? Math.round((totalLitersInSegments / totalDistanceKm) * 100 * 100) / 100
      : null;

  return {
    realAvgConsumption,
    segmentCount: segments.length,
    totalDistanceKm,
    totalLitersInSegments,
    segments,
  };
}

/**
 * Estimation coût voyage : distance × conso × prix/L.
 */
export function estimateTripFuelCost(input: {
  distanceKm: number;
  consumptionL100: number;
  pricePerLiter: number;
}): {
  litersNeeded: number;
  estimatedCost: number;
} {
  const litersNeeded =
    Math.round(((input.distanceKm * input.consumptionL100) / 100) * 1000) /
    1000;
  const estimatedCost =
    Math.round(litersNeeded * input.pricePerLiter * 100) / 100;
  return { litersNeeded, estimatedCost };
}

/**
 * Moins de 2 pleins complets → pas de moyenne (évite moyenne orpheline
 * après suppressions).
 */
export function resolveRealAvgAfterRecalc(
  fullFillCount: number,
  realAvgFromSegments: number | null,
): number | null {
  if (fullFillCount < 2) return null;
  return realAvgFromSegments;
}
