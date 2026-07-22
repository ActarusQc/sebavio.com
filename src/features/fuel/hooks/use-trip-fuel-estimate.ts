"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FuelMapMarkerFocus } from "@/features/fuel/components/fuel-stops-list";
import {
  buildEstimateFuelBody,
  mapDefaultFuelType,
  type TripFuelFormState,
} from "@/features/fuel/components/trip-fuel-form-shared";
import { buildFuelMapMarkers } from "@/features/fuel/lib/build-fuel-map-markers";
import { toUserFuelWarnings } from "@/features/fuel/lib/user-fuel-warnings";
import type { FuelEstimateDto, FuelFillStopDto } from "@/features/fuel/types";
import type { FuelMapMarker } from "@/features/maps/components/trip-map";

export type { TripFuelFormState };

export const DEFAULT_TRIP_FUEL_FORM: TripFuelFormState = {
  fuelType: "regular",
  includeReturnTrip: true,
  initialFuelMode: "full",
  initialFuelValue: "",
  departureRefillMode: "none",
  departureManualTotal: "",
  includeExistingFuelValue: false,
  refillStrategy: "full_tank",
  reserveMode: "percentage",
  reserveValue: "15",
  refillAtDestination: false,
  finishWithFullTank: false,
  defaultPricePerLiter: "",
  consumptionL100: "",
  forceManualPrice: false,
};

const FDE_UNSUPPORTED = new Set(["ethanol", "other"]);

const MANUAL_PRICE_MSG =
  "Aucun prix automatique disponible pour ce type de carburant. Entrez un prix manuel.";

export type UseTripFuelEstimateArgs = {
  tripId: string;
  vehicleId: string | null;
  vehicleLabel: string | null;
  distanceKm: string | null;
  estimatedFuelCost: string | null;
  routeFresh: boolean;
  /** Change quand l'itinéraire est recalculé (évite un plan carburant obsolète). */
  routeVersion?: string | null;
  /** Change quand les specs véhicule ont été marquées périmées. */
  vehicleSpecsVersion?: string | null;
  fuelEstimateStale?: boolean;
  defaultFuelType?: string | null;
  onFuelMarkersChange?: (markers: FuelMapMarker[]) => void;
  onFocusFuelStop?: (focus: FuelMapMarkerFocus | null) => void;
};

export function useTripFuelEstimate({
  tripId,
  vehicleId,
  vehicleLabel,
  distanceKm,
  estimatedFuelCost,
  routeFresh,
  routeVersion = null,
  vehicleSpecsVersion = null,
  fuelEstimateStale = false,
  defaultFuelType,
  onFuelMarkersChange,
  onFocusFuelStop,
}: UseTripFuelEstimateArgs) {
  const [estimate, setEstimate] = useState<FuelEstimateDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState("");
  const [pending, startTransition] = useTransition();
  const [vehicleSpecRecalcNotice, setVehicleSpecRecalcNotice] = useState(false);
  const [form, setForm] = useState<TripFuelFormState>({
    ...DEFAULT_TRIP_FUEL_FORM,
    fuelType: mapDefaultFuelType(defaultFuelType),
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyRef = useRef<string>("");
  const [syncedDefaultFuel, setSyncedDefaultFuel] = useState(defaultFuelType);
  const prevVehicleSpecsVersion = useRef(vehicleSpecsVersion);

  const hasVehicle = Boolean(vehicleId);
  const canCalculate = Boolean(routeFresh && distanceKm && vehicleId);
  const needsManualPrice =
    FDE_UNSUPPORTED.has(form.fuelType) || form.forceManualPrice;
  const blockedByManualPrice =
    canCalculate && needsManualPrice && !form.defaultPricePerLiter.trim();

  // Sync type carburant véhicule → formulaire (pattern React « adjust state when props change »)
  if (defaultFuelType && defaultFuelType !== syncedDefaultFuel) {
    setSyncedDefaultFuel(defaultFuelType);
    const mapped = mapDefaultFuelType(defaultFuelType);
    if (form.fuelType !== mapped) {
      setForm((f) => ({ ...f, fuelType: mapped }));
    }
  }

  // Notice recalcul specs véhicule (pattern React « adjust state when props change »)
  // Le changement de vehicleSpecsVersion dans la clé d’effet force déjà le recalcul.
  if (vehicleSpecsVersion !== prevVehicleSpecsVersion.current) {
    prevVehicleSpecsVersion.current = vehicleSpecsVersion;
    if (fuelEstimateStale) {
      setVehicleSpecRecalcNotice(true);
    }
  }

  useEffect(() => {
    if (!canCalculate || !distanceKm || !vehicleId || blockedByManualPrice) {
      lastKeyRef.current = "";
      return;
    }

    const body = buildEstimateFuelBody(form);
    const key = JSON.stringify({
      tripId,
      vehicleId,
      distanceKm,
      routeVersion,
      vehicleSpecsVersion,
      body,
    });
    if (lastKeyRef.current === key) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      lastKeyRef.current = key;
      setLastPayload(JSON.stringify(body));
      startTransition(async () => {
        // Ne pas effacer le plan précédent : évite la disparition visuelle des
        // arrêts carburant pendant le recalcul (ex. après ajout d'activité).
        setError(null);
        try {
          const res = await fetch(`/api/v1/trips/${tripId}/estimate-fuel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const json = (await res.json().catch(() => null)) as {
            success?: boolean;
            data?: { estimate?: FuelEstimateDto };
            estimate?: FuelEstimateDto;
            error?: { message?: string; code?: string };
            message?: string;
          } | null;
          if (!res.ok) {
            const code = json?.error?.code ?? "";
            const msg =
              json?.error?.message ?? json?.message ?? "Estimation impossible";
            const needsManual =
              code === "FUEL_006" ||
              code === "EXT_004" ||
              code === "FDE_009" ||
              /FUEL_006|aucun prix automatique|non supporté par FDE|non pris en charge/i.test(
                msg,
              );
            if (needsManual) {
              setForm((f) =>
                f.forceManualPrice ? f : { ...f, forceManualPrice: true },
              );
              setError(MANUAL_PRICE_MSG);
            } else if (code === "VEHICLE_FUEL_CONSUMPTION_REQUIRED") {
              setError(
                msg ||
                  "La consommation de ce véhicule est inconnue. Ajoutez-la dans la fiche du véhicule.",
              );
            } else {
              setError(msg);
            }
            // Conserver le dernier plan valide (stale) — ne jamais remplacer par [].
            return;
          }
          const nextEstimate = json?.data?.estimate ?? json?.estimate ?? null;
          if (nextEstimate) {
            setEstimate(nextEstimate);
            setError(null);
            setVehicleSpecRecalcNotice(false);
          } else {
            setError(
              "Réponse d’estimation invalide — aucun plan de ravitaillement reçu.",
            );
            // Conserver l'ancien estimate si présent.
          }
        } catch {
          setError("Estimation impossible");
          // Conserver l'ancien estimate si présent.
        }
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    canCalculate,
    tripId,
    vehicleId,
    distanceKm,
    routeVersion,
    vehicleSpecsVersion,
    form,
    blockedByManualPrice,
  ]);

  const calc = estimate?.calculation;
  const activeEstimate =
    canCalculate && !blockedByManualPrice ? estimate : null;
  const activeError = blockedByManualPrice ? MANUAL_PRICE_MSG : error;

  const userFuelWarnings = toUserFuelWarnings(activeEstimate?.warnings, {
    forceEstimateNotice: Boolean(
      activeEstimate?.fallbackUsed ||
      activeEstimate?.calculation?.allStops?.some(
        (s) =>
          s.kind === "en_route" &&
          (s.isEstimatedLocation || s.priceGranularity === "regional"),
      ),
    ),
    forceStaleNotice:
      activeEstimate?.freshness === "aging" ||
      activeEstimate?.freshness === "stale",
  });

  useEffect(() => {
    if (!onFuelMarkersChange) return;
    // En cas d'échec / plan non faisable : ne pas effacer les marqueurs
    // si un calcul précédent (stale) est encore affiché via `estimate`.
    if (!calc?.feasible) {
      if (!estimate?.calculation?.feasible) {
        onFuelMarkersChange([]);
      }
      return;
    }
    onFuelMarkersChange(
      buildFuelMapMarkers(
        calc.outbound?.refuelStops ?? [],
        calc.returnLeg?.refuelStops ?? [],
      ),
    );
  }, [calc, estimate, onFuelMarkersChange]);

  const departureStops: FuelFillStopDto[] =
    calc?.outbound.stops.filter((s) => s.kind === "departure") ?? [];
  const destinationStops: FuelFillStopDto[] =
    calc?.allStops.filter((s) => s.kind === "destination") ?? [];
  const finalStops: FuelFillStopDto[] =
    calc?.allStops.filter((s) => s.kind === "final") ?? [];

  function patch<K extends keyof TripFuelFormState>(
    key: K,
    value: TripFuelFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function recalculate() {
    lastKeyRef.current = "";
    setForm((f) => ({ ...f }));
  }

  return {
    form,
    patch,
    setForm,
    estimate: activeEstimate,
    calc: activeEstimate?.calculation,
    error: activeError,
    pending,
    hasVehicle,
    canCalculate,
    needsManualPrice,
    vehicleLabel,
    distanceKm,
    estimatedFuelCost,
    routeFresh,
    userFuelWarnings,
    departureStops,
    destinationStops,
    finalStops,
    lastPayload,
    onFocusFuelStop,
    recalculate,
    fdeUnsupported: FDE_UNSUPPORTED,
    vehicleSpecRecalcNotice:
      vehicleSpecRecalcNotice || (fuelEstimateStale && pending),
    fuelCalculationStatus: (fuelEstimateStale
      ? "stale"
      : activeEstimate
        ? "current"
        : "unavailable") as "current" | "stale" | "unavailable",
  };
}

export type TripFuelEstimateApi = ReturnType<typeof useTripFuelEstimate>;
