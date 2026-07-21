import { roundCoord } from "./units";

export type WeatherLocationPoint = {
  id: string;
  latitude: number;
  longitude: number;
  /** Date YYYY-MM-DD concernée (optionnel pour regroupement temporel). */
  date: string | null;
};

export type WeatherLocationCluster = {
  key: string;
  latitude: number;
  longitude: number;
  memberIds: string[];
  dates: string[];
};

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function datesCompatible(a: string | null, b: string | null): boolean {
  if (!a || !b) return true;
  // Même jour ou jours adjacents → mêmes données quotidiennes utiles.
  const da = Date.parse(`${a}T00:00:00.000Z`);
  const db = Date.parse(`${b}T00:00:00.000Z`);
  if (!Number.isFinite(da) || !Number.isFinite(db)) return true;
  return Math.abs(da - db) <= 2 * 86_400_000;
}

/**
 * Regroupe les points proches (rayon km) dont les dates sont compatibles
 * pour mutualiser un seul appel fournisseur / entrée cache.
 */
export function clusterWeatherLocations(
  points: WeatherLocationPoint[],
  radiusKm = 20,
): WeatherLocationCluster[] {
  const clusters: WeatherLocationCluster[] = [];

  for (const point of points) {
    let joined: WeatherLocationCluster | null = null;
    for (const cluster of clusters) {
      const dist = haversineKm(
        { lat: cluster.latitude, lng: cluster.longitude },
        { lat: point.latitude, lng: point.longitude },
      );
      if (dist > radiusKm) continue;
      const dateOk = cluster.dates.every((d) => datesCompatible(d, point.date));
      if (!dateOk && point.date) continue;
      joined = cluster;
      break;
    }

    if (!joined) {
      clusters.push({
        key: `c:${roundCoord(point.latitude)}:${roundCoord(point.longitude)}`,
        latitude: point.latitude,
        longitude: point.longitude,
        memberIds: [point.id],
        dates: point.date ? [point.date] : [],
      });
      continue;
    }

    joined.memberIds.push(point.id);
    if (point.date && !joined.dates.includes(point.date)) {
      joined.dates.push(point.date);
    }
  }

  return clusters;
}
