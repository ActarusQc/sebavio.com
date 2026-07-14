/**
 * Résolution litres / prix/L / total (2 sur 3 requis).
 * Tolérance 2 % si les trois valeurs sont fournies (arrondi pompe).
 */

export const FUEL_AMOUNT_TOLERANCE = 0.02;

export type FuelAmountInput = {
  liters?: number | null;
  pricePerLiter?: number | null;
  totalCost?: number | null;
};

export type ResolvedFuelAmounts = {
  liters: number;
  pricePerLiter: number;
  totalCost: number;
};

function isPresent(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v);
}

function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function relativeDiscrepancy(a: number, b: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b), Number.EPSILON);
  return Math.abs(a - b) / denom;
}

/**
 * @throws Error message string — le schéma Zod / service mappe vers AppError
 */
export function resolveFuelAmounts(
  input: FuelAmountInput,
): ResolvedFuelAmounts {
  const hasL = isPresent(input.liters) && input.liters! > 0;
  const hasP = isPresent(input.pricePerLiter) && input.pricePerLiter! > 0;
  const hasT = isPresent(input.totalCost) && input.totalCost! > 0;

  const count = [hasL, hasP, hasT].filter(Boolean).length;
  if (count < 2) {
    throw new Error(
      "Indiquez au moins deux valeurs parmi litres, prix/L et total",
    );
  }

  const liters = hasL ? input.liters! : null;
  const pricePerLiter = hasP ? input.pricePerLiter! : null;
  const totalCost = hasT ? input.totalCost! : null;

  if (
    count === 3 &&
    liters != null &&
    pricePerLiter != null &&
    totalCost != null
  ) {
    const product = liters * pricePerLiter;
    if (relativeDiscrepancy(product, totalCost) > FUEL_AMOUNT_TOLERANCE) {
      throw new Error("Écart > 2 % entre litres × prix/L et le total saisi");
    }
    return {
      liters: round(liters, 3),
      pricePerLiter: round(pricePerLiter, 3),
      totalCost: round(totalCost, 2),
    };
  }

  if (liters != null && pricePerLiter != null) {
    return {
      liters: round(liters, 3),
      pricePerLiter: round(pricePerLiter, 3),
      totalCost: round(liters * pricePerLiter, 2),
    };
  }

  if (liters != null && totalCost != null) {
    return {
      liters: round(liters, 3),
      pricePerLiter: round(totalCost / liters, 3),
      totalCost: round(totalCost, 2),
    };
  }

  // pricePerLiter + totalCost
  return {
    liters: round(totalCost! / pricePerLiter!, 3),
    pricePerLiter: round(pricePerLiter!, 3),
    totalCost: round(totalCost!, 2),
  };
}
