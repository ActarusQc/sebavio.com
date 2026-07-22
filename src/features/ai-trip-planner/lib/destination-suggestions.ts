/**
 * Suggestions de destinations QC filtrées par durée d’aller (sens unique).
 * Estimation : distance orthodromique × facteur route (~1.3) à ~85 km/h.
 */

export type DestinationSuggestion = {
  name: string;
  city: string;
  latitude: number;
  longitude: number;
};

/** Catalogue de destinations populaires au Québec / environs. */
export const QC_DESTINATION_CATALOG: DestinationSuggestion[] = [
  { name: "Magog", city: "Magog", latitude: 45.2665, longitude: -72.147 },
  { name: "Bromont", city: "Bromont", latitude: 45.3186, longitude: -72.649 },
  {
    name: "Sherbrooke",
    city: "Sherbrooke",
    latitude: 45.4042,
    longitude: -71.8929,
  },
  { name: "Orford", city: "Orford", latitude: 45.314, longitude: -72.215 },
  {
    name: "Mont-Tremblant",
    city: "Mont-Tremblant",
    latitude: 46.1185,
    longitude: -74.5962,
  },
  {
    name: "Saint-Sauveur",
    city: "Saint-Sauveur",
    latitude: 45.886,
    longitude: -74.18,
  },
  {
    name: "Québec",
    city: "Québec",
    latitude: 46.8139,
    longitude: -71.208,
  },
  {
    name: "Baie-Saint-Paul",
    city: "Baie-Saint-Paul",
    latitude: 47.441,
    longitude: -70.505,
  },
  {
    name: "Tadoussac",
    city: "Tadoussac",
    latitude: 48.143,
    longitude: -69.715,
  },
  {
    name: "Trois-Rivières",
    city: "Trois-Rivières",
    latitude: 46.343,
    longitude: -72.543,
  },
  {
    name: "Ottawa",
    city: "Ottawa",
    latitude: 45.4215,
    longitude: -75.6972,
  },
  {
    name: "Kingston",
    city: "Kingston",
    latitude: 44.2312,
    longitude: -76.486,
  },
  {
    name: "Percé",
    city: "Percé",
    latitude: 48.5244,
    longitude: -64.212,
  },
  {
    name: "Gaspé",
    city: "Gaspé",
    latitude: 48.8302,
    longitude: -64.4818,
  },
  {
    name: "Rimouski",
    city: "Rimouski",
    latitude: 48.449,
    longitude: -68.524,
  },
  {
    name: "Saguenay",
    city: "Saguenay",
    latitude: 48.428,
    longitude: -71.068,
  },
];

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Minutes d’aller estimées (trajet routier approximatif). */
export function estimateOneWayDriveMinutes(
  originLat: number,
  originLng: number,
  dest: DestinationSuggestion,
): number {
  const roadKm =
    haversineKm(originLat, originLng, dest.latitude, dest.longitude) * 1.3;
  return Math.round((roadKm / 85) * 60);
}

export function filterDestinationsWithinOneWayLimit(input: {
  originLatitude: number | null | undefined;
  originLongitude: number | null | undefined;
  maxDriveMinutes: number | null | undefined;
  maxDistanceKm: number | null | undefined;
  limit?: number;
}): DestinationSuggestion[] {
  const { originLatitude, originLongitude } = input;
  if (
    originLatitude == null ||
    originLongitude == null ||
    !Number.isFinite(originLatitude) ||
    !Number.isFinite(originLongitude)
  ) {
    // Sans coords : suggestions « courtes » par défaut (exclure Gaspésie lointaine)
    return QC_DESTINATION_CATALOG.filter(
      (d) => !/perc[eé]|gasp[eé]|rimouski|tadoussac|saguenay/i.test(d.name),
    ).slice(0, input.limit ?? 6);
  }

  const maxMin = input.maxDriveMinutes ?? null;
  const maxKm = input.maxDistanceKm ?? null;
  if (maxMin == null && maxKm == null) {
    return QC_DESTINATION_CATALOG.slice(0, input.limit ?? 6);
  }

  const scored = QC_DESTINATION_CATALOG.map((d) => {
    const minutes = estimateOneWayDriveMinutes(
      originLatitude,
      originLongitude,
      d,
    );
    const km =
      haversineKm(originLatitude, originLongitude, d.latitude, d.longitude) *
      1.3;
    return { dest: d, minutes, km };
  })
    .filter((s) => {
      if (maxMin != null && s.minutes > maxMin * 1.1) return false;
      if (maxKm != null && s.km > maxKm * 1.1) return false;
      return true;
    })
    .sort((a, b) => a.minutes - b.minutes);

  return scored.slice(0, input.limit ?? 6).map((s) => s.dest);
}

export function destinationQuickReplies(input: {
  originLatitude: number | null | undefined;
  originLongitude: number | null | undefined;
  maxDriveMinutes: number | null | undefined;
  maxDistanceKm: number | null | undefined;
}): string[] {
  const list = filterDestinationsWithinOneWayLimit({ ...input, limit: 5 });
  const names = list.map((d) => d.name);
  if (names.length === 0) {
    return ["Magog", "Bromont", "Saint-Sauveur", "Autre destination"];
  }
  return [...names, "Autre destination"];
}
