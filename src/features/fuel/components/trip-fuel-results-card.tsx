"use client";

/**
 * Compat : panneau résultats empilé (variant stacked du TripFuelEstimatePanel).
 * Sur la page détail voyage, les résultats sont intégrés dans TripFuelSettingsCard
 * et le plan dans TripRefuelPlanSection.
 */
import { TripFuelSettingsCard } from "@/features/fuel/components/trip-fuel-settings-card";
import { TripRefuelPlanSection } from "@/features/fuel/components/trip-refuel-plan-section";

export function TripFuelResultsCard() {
  return (
    <div className="space-y-4" data-testid="trip-fuel-results">
      <TripRefuelPlanSection />
    </div>
  );
}

/** @deprecated alias — préférer TripFuelSettingsCard */
export function TripFuelEstimateStacked() {
  return (
    <>
      <TripFuelSettingsCard />
      <TripFuelResultsCard />
    </>
  );
}
