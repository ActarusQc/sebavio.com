import type { FuelFillStopDto } from "@/features/fuel/types";
import type { FuelMapMarker } from "@/features/maps/components/trip-map";

function parseCoord(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Marqueurs carte pour les arrêts en route uniquement.
 * Aucun marqueur sans coordonnées valides.
 */
export function buildFuelMapMarkers(
  outboundRefuelStops: FuelFillStopDto[],
  returnRefuelStops: FuelFillStopDto[] = [],
): FuelMapMarker[] {
  const markers: FuelMapMarker[] = [];

  const push = (stop: FuelFillStopDto, kind: FuelMapMarker["kind"]) => {
    const lat = parseCoord(stop.station?.latitude);
    const lng = parseCoord(stop.station?.longitude);
    if (lat == null || lng == null) return;

    const confirmed =
      Boolean(stop.station?.name?.trim()) && !stop.isEstimatedLocation;
    const place = stop.station?.city?.trim() || null;
    const estimatedTitle = place
      ? `Arrêt recommandé près de ${place}`
      : "Arrêt recommandé le long de l'itinéraire";

    markers.push({
      id: `fuel:${stop.id}`,
      kind,
      sequence: stop.sequence,
      title: confirmed ? stop.station!.name!.trim() : estimatedTitle,
      lat,
      lng,
      info: {
        name: confirmed ? stop.station!.name : estimatedTitle,
        address: confirmed ? stop.station?.address : null,
        city: place,
        pricePerLiter: stop.pricePerLiter,
        litersAdded: stop.litersAdded,
        cost: stop.cost,
        distanceFromStartKm: stop.distanceFromStartKm,
        isEstimatedLocation: !confirmed,
      },
    });
  };

  for (const s of outboundRefuelStops) push(s, "fuel_outbound");
  for (const s of returnRefuelStops) push(s, "fuel_return");
  return markers;
}
