export const TRIP_FUEL_TYPE_OPTIONS = [
  { value: "regular", label: "Essence ordinaire" },
  { value: "midGrade", label: "Essence intermédiaire" },
  { value: "premium", label: "Essence super" },
  { value: "diesel", label: "Diesel" },
  { value: "ethanol", label: "E85" },
  { value: "other", label: "Autre" },
] as const;

export type TripFuelTypeValue =
  (typeof TRIP_FUEL_TYPE_OPTIONS)[number]["value"];

export type TripFuelFormState = {
  fuelType: TripFuelTypeValue;
  includeReturnTrip: boolean;
  initialFuelMode: string;
  initialFuelValue: string;
  departureRefillMode: string;
  departureManualTotal: string;
  includeExistingFuelValue: boolean;
  refillStrategy: string;
  reserveMode: string;
  reserveValue: string;
  refillAtDestination: boolean;
  finishWithFullTank: boolean;
  defaultPricePerLiter: string;
  consumptionL100: string;
  forceManualPrice: boolean;
};

export function mapDefaultFuelType(
  raw: string | null | undefined,
): TripFuelTypeValue {
  if (!raw) return "regular";
  const k = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s_-]+/g, "");
  if (
    k === "regular" ||
    k.includes("ordinaire") ||
    k === "gasoline" ||
    k === "essence" ||
    k === "hybrid" ||
    k === "hybride" ||
    k.includes("essenceordinaire")
  ) {
    return "regular";
  }
  if (k.includes("diesel")) return "diesel";
  if (k.includes("premium") || k.includes("super")) return "premium";
  if (k.includes("mid") || k.includes("inter")) return "midGrade";
  if (k.includes("e85") || k.includes("ethanol")) return "ethanol";
  if (
    k === "other" ||
    k.includes("autre") ||
    k.includes("propane") ||
    k.includes("hydrogen") ||
    k.includes("hydrogene")
  ) {
    return "other";
  }
  // Types thermiques / hybrides inconnus → essence ordinaire (FDE), pas « other »
  if (
    k.includes("gas") ||
    k.includes("petrol") ||
    k.includes("fuel") ||
    k.includes("therm")
  ) {
    return "regular";
  }
  // Électrique / PHEV : laisser regular côté formulaire ; le backend gère not_applicable
  if (
    k.includes("electric") ||
    k.includes("electrique") ||
    k.includes("plugin") ||
    k.includes("phev") ||
    k === "bev"
  ) {
    return "regular";
  }
  return "regular";
}

export function buildEstimateFuelBody(
  form: TripFuelFormState,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    fuelType: form.fuelType,
    includeReturnTrip: form.includeReturnTrip,
    includeExistingFuelValue: form.includeExistingFuelValue,
    refillStrategy: form.refillStrategy,
    refillAtDestination: form.refillAtDestination,
    finishWithFullTank: form.finishWithFullTank,
    initialFuel: {
      mode: form.initialFuelMode,
      ...(form.initialFuelValue !== ""
        ? { value: Number(form.initialFuelValue) }
        : {}),
    },
    departureRefill: {
      mode: form.departureRefillMode,
      ...(form.departureManualTotal !== ""
        ? { manualTotal: Number(form.departureManualTotal) }
        : {}),
    },
    reserve: {
      mode: form.reserveMode,
      value: Number(form.reserveValue) || 15,
    },
  };
  if (form.defaultPricePerLiter.trim() !== "") {
    body.defaultPricePerLiter = Number(form.defaultPricePerLiter);
  }
  if (form.consumptionL100.trim() !== "") {
    body.consumptionL100 = Number(form.consumptionL100);
  }
  return body;
}

export function formatKm(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatConso(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export function formatLiters(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCost(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const INITIAL_FUEL_LABELS: Record<string, string> = {
  full: "Plein",
  three_quarters: "3/4",
  half: "1/2",
  quarter: "1/4",
  empty: "Vide",
  percentage: "Pourcentage personnalisé",
  litres: "Litres personnalisés",
};

const DEPARTURE_REFILL_LABELS: Record<string, string> = {
  none: "Ne pas facturer le plein initial",
  automatic: "Calculer automatiquement",
  manual_total: "Montant manuel",
};

const STRATEGY_LABELS: Record<string, string> = {
  full_tank: "Remplir complètement le réservoir",
  required_only: "Quantité nécessaire seulement",
  optimized: "Optimisation de coût",
};

export function summarizeTripLeg(
  includeReturn: boolean,
  distanceKm: string | null,
): string {
  const dist = distanceKm ? `${formatKm(distanceKm)} km` : "—";
  return includeReturn
    ? `Aller-retour · Distance aller : ${dist}`
    : `Aller simple · Distance aller : ${dist}`;
}

export function summarizeInitialFuel(mode: string, value: string): string {
  if (mode === "percentage" && value) return `Niveau initial : ${value} %`;
  if (mode === "litres" && value) return `Niveau initial : ${value} L`;
  return `Niveau initial : ${INITIAL_FUEL_LABELS[mode] ?? mode}`;
}

export function summarizeDepartureRefill(mode: string): string {
  return DEPARTURE_REFILL_LABELS[mode] ?? mode;
}

export function summarizeStrategy(
  strategy: string,
  reserveMode: string,
  reserveValue: string,
): string {
  const strat = STRATEGY_LABELS[strategy] ?? strategy;
  const reserve =
    reserveMode === "litres"
      ? `Réserve minimale : ${reserveValue} L`
      : `Réserve minimale : ${reserveValue} %`;
  return `Stratégie : ${strat} · ${reserve}`;
}
