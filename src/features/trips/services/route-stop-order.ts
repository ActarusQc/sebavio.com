import type { LatLng } from "@/services/maps/types";

/** Progression 0–1 le long de l'axe origine → destination (approx.). */
export function progressAlongOdAxis(
  point: LatLng,
  origin: LatLng,
  destination: LatLng,
): number {
  const dx = destination.lng - origin.lng;
  const dy = destination.lat - origin.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return 0;
  const t =
    ((point.lng - origin.lng) * dx + (point.lat - origin.lat) * dy) / len2;
  return Math.max(0, Math.min(1, t));
}

/**
 * Séquence d'insertion pour un nouvel arrêt aller :
 * avant la destination, après les étapes déjà plus proches de l'origine.
 */
export function computeOutboundInsertSequence(input: {
  activity: LatLng;
  origin: LatLng;
  destination: LatLng;
  existingStops: Array<{ latitude: number; longitude: number }>;
}): number {
  const activityProgress = progressAlongOdAxis(
    input.activity,
    input.origin,
    input.destination,
  );
  let before = 0;
  for (const s of input.existingStops) {
    const p = progressAlongOdAxis(
      { lat: s.latitude, lng: s.longitude },
      input.origin,
      input.destination,
    );
    if (p <= activityProgress) before += 1;
  }
  return before + 1;
}
