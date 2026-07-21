"use client";

import { TripFuelEstimateProvider } from "@/features/fuel/components/trip-fuel-estimate-context";
import { TripFuelResultsCard } from "@/features/fuel/components/trip-fuel-results-card";
import { TripFuelSettingsCard } from "@/features/fuel/components/trip-fuel-settings-card";
import type { FuelMapMarkerFocus } from "@/features/fuel/components/fuel-stops-list";
import type { FuelMapMarker } from "@/features/maps/components/trip-map";

export {
  TRIP_FUEL_TYPE_OPTIONS,
  buildEstimateFuelBody,
  mapDefaultFuelType,
  type TripFuelTypeValue,
  type TripFuelFormState,
} from "@/features/fuel/components/trip-fuel-form-shared";

export { TripFuelEstimateProvider } from "@/features/fuel/components/trip-fuel-estimate-context";
export { TripFuelSettingsCard } from "@/features/fuel/components/trip-fuel-settings-card";
export { TripFuelResultsCard } from "@/features/fuel/components/trip-fuel-results-card";
export { TripRefuelPlanSection } from "@/features/fuel/components/trip-refuel-plan-section";

type Props = {
  tripId: string;
  vehicleId: string | null;
  vehicleLabel: string | null;
  distanceKm: string | null;
  estimatedFuelCost: string | null;
  routeFresh: boolean;
  defaultFuelType?: string | null;
  onFuelMarkersChange?: (markers: FuelMapMarker[]) => void;
  onFocusFuelStop?: (focus: FuelMapMarkerFocus | null) => void;
  /** Affichage empilé (défaut) ou settings seuls. */
  variant?: "stacked" | "settings";
};

/**
 * Panneau estimation carburant — logique métier inchangée (hook partagé).
 */
export function TripFuelEstimatePanel({
  variant = "stacked",
  ...props
}: Props) {
  return (
    <TripFuelEstimateProvider {...props}>
      <div className="space-y-4">
        <TripFuelSettingsCard />
        {variant === "stacked" ? <TripFuelResultsCard /> : null}
      </div>
    </TripFuelEstimateProvider>
  );
}
