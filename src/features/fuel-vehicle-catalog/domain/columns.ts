import { normalizeSearchText } from "./normalize";

export type CanonicalColumn =
  | "modelYear"
  | "make"
  | "model"
  | "vehicleClass"
  | "engineSizeLitres"
  | "cylinders"
  | "transmission"
  | "fuelType"
  | "fuelType1"
  | "fuelType2"
  | "cityL100"
  | "highwayL100"
  | "combinedL100"
  | "combinedMpg"
  | "co2Emissions"
  | "co2Rating"
  | "smogRating"
  | "cityKwh"
  | "highwayKwh"
  | "combinedKwh"
  | "rangeKm"
  | "range1Km"
  | "motorKw";

const ALIASES: Record<CanonicalColumn, string[]> = {
  modelYear: ["model year", "annee modele", "année modèle", "year"],
  make: ["make", "marque"],
  model: ["model", "modele", "modèle"],
  vehicleClass: [
    "vehicle class",
    "categorie de vehicule",
    "catégorie de véhicule",
  ],
  engineSizeLitres: [
    "engine size l",
    "engine size (l)",
    "cylindree l",
    "cylindrée (l)",
  ],
  cylinders: ["cylinders", "cylindres"],
  transmission: ["transmission"],
  fuelType: ["fuel type", "type de carburant"],
  fuelType1: ["fuel type 1", "type de carburant 1"],
  fuelType2: ["fuel type 2", "type de carburant 2"],
  cityL100: [
    "city l/100 km",
    "city (l/100 km)",
    "ville l/100 km",
    "ville (l/100 km)",
  ],
  highwayL100: [
    "highway l/100 km",
    "highway (l/100 km)",
    "route l/100 km",
    "route (l/100 km)",
  ],
  combinedL100: [
    "combined l/100 km",
    "combined (l/100 km)",
    "combinee l/100 km",
    "combinée (l/100 km)",
  ],
  combinedMpg: [
    "combined mpg",
    "combined (mpg)",
    "combinee mi/gal",
    "combinée (mi/gal)",
  ],
  co2Emissions: [
    "co2 emissions g/km",
    "co2 emissions (g/km)",
    "emissions de co2 g/km",
    "émissions de co2 (g/km)",
  ],
  co2Rating: ["co2 rating", "indice de co2"],
  smogRating: ["smog rating", "indice de smog"],
  cityKwh: ["city kwh/100 km", "city (kwh/100 km)"],
  highwayKwh: ["highway kwh/100 km", "highway (kwh/100 km)"],
  combinedKwh: [
    "combined kwh/100 km",
    "combined (kwh/100 km)",
    "combinee kwh/100 km",
  ],
  rangeKm: ["range km", "range (km)", "autonomie km", "autonomie (km)"],
  range1Km: ["range 1 km", "range 1 (km)", "autonomie 1 km"],
  motorKw: ["motor kw", "motor (kw)", "moteur kw"],
};

function headerKey(header: string): string {
  return normalizeSearchText(header)
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mappe les en-têtes FR/EN vers des colonnes canoniques (indépendant de la position).
 */
export function mapHeaders(headers: string[]): Map<CanonicalColumn, number> {
  const result = new Map<CanonicalColumn, number>();
  const keyed = headers.map((h, index) => ({ key: headerKey(h), index }));

  for (const [canonical, aliases] of Object.entries(ALIASES) as Array<
    [CanonicalColumn, string[]]
  >) {
    const wanted = aliases.map((a) => headerKey(a));
    const hit = keyed.find((h) => wanted.includes(h.key));
    if (hit) result.set(canonical, hit.index);
  }

  // BEV/PHEV : "Combined Le/100 km" ne doit pas écraser L/100 thermique
  if (!result.has("combinedL100")) {
    const le = keyed.find((h) => h.key.includes("combined le"));
    if (le) result.set("combinedL100", le.index);
  }

  return result;
}

export function cellAt(
  row: string[],
  map: Map<CanonicalColumn, number>,
  column: CanonicalColumn,
): string | null {
  const idx = map.get(column);
  if (idx == null || idx < 0 || idx >= row.length) return null;
  const v = row[idx];
  return v == null ? null : String(v);
}
