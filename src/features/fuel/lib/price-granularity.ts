/**
 * Classification honnête de la granularité des prix stations.
 * Un prix n'est `station_exact` que s'il est propre à la station
 * et non partagé massivement (médiane / feed régional).
 */

export type PriceGranularityKind =
  "station_exact" | "city_estimate" | "regional_estimate" | "unknown";

export type StationPriceObservation = {
  stationId: string;
  regionLabel: string | null;
  price: number;
  observedAt: string;
  collectedAt?: string | null;
  /** Granularité déclarée par la source (ex. FDE). */
  declaredGranularity?: string | null;
};

export type ClassifiedStationPrice = StationPriceObservation & {
  priceIdentity: string;
  granularity: PriceGranularityKind;
  isStationLevel: boolean;
};

/** Empreinte de la donnée de prix (pas l'ID station). */
export function buildPriceIdentity(input: {
  price: number;
  observedAt: string;
  collectedAt?: string | null;
}): string {
  const price = Math.round(input.price * 1000) / 1000;
  const collected = input.collectedAt?.trim() || "";
  return `${price.toFixed(3)}|${input.observedAt}|${collected}`;
}

/**
 * Classifie les prix : si le même identity est partagé par plusieurs stations
 * (surtout dans la même région), on rétrograde en estimation régionale.
 */
export function classifyStationPrices(
  observations: StationPriceObservation[],
  options?: { sharedIdentityThreshold?: number },
): {
  classified: ClassifiedStationPrice[];
  distinctPriceValues: number;
  distinctPriceIdentities: number;
  sharedIdentityWarnings: string[];
} {
  /** Plusieurs stations (seuil 2) partageant la même donnée de prix → pas exact. */
  const threshold = options?.sharedIdentityThreshold ?? 2;
  const byIdentity = new Map<string, StationPriceObservation[]>();

  for (const obs of observations) {
    const id = buildPriceIdentity(obs);
    const list = byIdentity.get(id) ?? [];
    list.push(obs);
    byIdentity.set(id, list);
  }

  const warnings: string[] = [];
  const classified: ClassifiedStationPrice[] = [];

  for (const obs of observations) {
    const priceIdentity = buildPriceIdentity(obs);
    const siblings = byIdentity.get(priceIdentity) ?? [obs];
    const sameRegion = siblings.filter(
      (s) =>
        (s.regionLabel ?? "").trim() === (obs.regionLabel ?? "").trim() &&
        (obs.regionLabel ?? "").trim() !== "",
    );

    let granularity: PriceGranularityKind = "station_exact";
    if (obs.declaredGranularity === "regional") {
      granularity = "regional_estimate";
    } else if (siblings.length >= threshold) {
      granularity = "regional_estimate";
      warnings.push(
        `Identifiant de prix partagé ${priceIdentity.split("|")[0]} $/L sur ${siblings.length} stations — traité comme estimation régionale.`,
      );
    } else if (sameRegion.length >= threshold) {
      granularity = "regional_estimate";
    } else if (
      obs.declaredGranularity &&
      obs.declaredGranularity !== "station"
    ) {
      granularity = "city_estimate";
    }

    classified.push({
      ...obs,
      priceIdentity,
      granularity,
      isStationLevel: granularity === "station_exact",
    });
  }

  const distinctPriceValues = new Set(
    observations.map((o) => Math.round(o.price * 1000) / 1000),
  ).size;
  const distinctPriceIdentities = byIdentity.size;

  return {
    classified,
    distinctPriceValues,
    distinctPriceIdentities,
    sharedIdentityWarnings: [...new Set(warnings)],
  };
}
