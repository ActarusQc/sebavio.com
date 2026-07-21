/**
 * Calculs d'autonomie / consommation segmentaires — métier pur.
 */

export function litersForDistanceKm(
  distanceKm: number,
  consumptionL100: number,
): number {
  if (!(distanceKm > 0) || !(consumptionL100 > 0)) return 0;
  return (distanceKm * consumptionL100) / 100;
}

export function rangeKmFromLiters(
  liters: number,
  consumptionL100: number,
): number {
  if (!(liters > 0) || !(consumptionL100 > 0)) return 0;
  return (liters / consumptionL100) * 100;
}

export function tankFraction(fuelL: number, tankCapacityL: number): number {
  if (!(tankCapacityL > 0)) return 0;
  return Math.max(0, Math.min(1, fuelL / tankCapacityL));
}

export function consumeFuel(input: {
  fuelL: number;
  distanceKm: number;
  consumptionL100: number;
}): { fuelL: number; litersConsumed: number } {
  const litersConsumed = litersForDistanceKm(
    input.distanceKm,
    input.consumptionL100,
  );
  return {
    fuelL: input.fuelL - litersConsumed,
    litersConsumed,
  };
}
