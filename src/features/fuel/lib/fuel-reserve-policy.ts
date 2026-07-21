import type { FuelSimulationConfig } from "@/features/fuel/config/simulation";

/**
 * Réserve de sécurité effective : max(fraction du réservoir, litres pour N km).
 */
export function effectiveReserveLiters(input: {
  tankCapacityL: number;
  consumptionL100: number;
  config: Pick<FuelSimulationConfig, "reserveFraction" | "reserveMinKm">;
}): number {
  const byFraction = input.tankCapacityL * input.config.reserveFraction;
  const byRangeKm = (input.config.reserveMinKm * input.consumptionL100) / 100;
  return Math.max(byFraction, byRangeKm);
}

export function usableFuelLiters(fuelL: number, reserveL: number): number {
  return Math.max(0, fuelL - reserveL);
}
