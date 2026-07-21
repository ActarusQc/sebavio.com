/** Accords français pour les compteurs d'étapes / arrêts. */

export function formatEtapesCount(n: number): string {
  if (n <= 0) return "0 étape";
  if (n === 1) return "1 étape";
  return `${n} étapes`;
}

export function formatArretsCarburantCount(n: number): string {
  if (n <= 0) return "0 arrêt";
  if (n === 1) return "1 arrêt";
  return `${n} arrêts`;
}

export function formatActivitesCount(n: number): string {
  if (n <= 0) return "0 activité";
  if (n === 1) return "1 activité";
  return `${n} activités`;
}

export function formatDetoursCount(n: number): string {
  if (n <= 0) return "0 détour";
  if (n === 1) return "1 détour";
  return `${n} détours`;
}

const ACTIVITY_TYPES = new Set(["activity"]);
const DETOUR_TYPES = new Set([
  "detour",
  "pass_through",
  "lodging",
  "other",
  "stop",
  "rest",
  "camping",
]);

export function countRouteStopsByKind(stops: Array<{ stopType: string }>): {
  routeStopCount: number;
  activityStopCount: number;
  detourStopCount: number;
  manualStopCount: number;
} {
  let activityStopCount = 0;
  let detourStopCount = 0;
  let manualStopCount = 0;
  for (const s of stops) {
    if (ACTIVITY_TYPES.has(s.stopType)) {
      activityStopCount += 1;
    } else if (DETOUR_TYPES.has(s.stopType) || s.stopType === "fuel") {
      if (s.stopType !== "fuel") {
        detourStopCount += 1;
        manualStopCount += 1;
      }
    } else {
      manualStopCount += 1;
      detourStopCount += 1;
    }
  }
  return {
    routeStopCount: stops.length,
    activityStopCount,
    detourStopCount,
    manualStopCount,
  };
}
