/**
 * Calculs monétaires via Prisma.Decimal (pas de flottants IEEE).
 * Arrondi HALF_UP à 2 décimales (centimes).
 */
import { Prisma } from "@prisma/client";

export type DecimalLike = Prisma.Decimal | string | number;

export function toMoney(value: DecimalLike): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}

export function moneyToString(value: DecimalLike | null | undefined): string {
  if (value == null) return "0.00";
  return toMoney(value).toFixed(2);
}

export function addMoney(...values: DecimalLike[]): Prisma.Decimal {
  let sum = new Prisma.Decimal(0);
  for (const v of values) {
    sum = sum.plus(toMoney(v));
  }
  return toMoney(sum);
}

export function subtractMoney(a: DecimalLike, b: DecimalLike): Prisma.Decimal {
  return toMoney(toMoney(a).minus(toMoney(b)));
}

/** Écart budget − réel (négatif = dépassement). */
export function budgetVariance(
  planned: DecimalLike | null | undefined,
  actual: DecimalLike,
): string | null {
  if (planned == null) return null;
  return moneyToString(subtractMoney(planned, actual));
}
