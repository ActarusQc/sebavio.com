import { createHash } from "node:crypto";

/** Types carburant stockés (mapping Régie → Doc Sebavio). */
export const REGIE_FUEL_TYPES = ["regular", "premium", "diesel"] as const;
export type RegieFuelType = (typeof REGIE_FUEL_TYPES)[number];

export const MIN_STATION_ROWS_DEFAULT = 1500;
export const MISSING_STREAK_SOFT_DELETE = 3;
export const INGEST_COOLDOWN_MS = 30 * 60 * 1000;
export const REGIE_MAX_AGE_MS = 48 * 60 * 60 * 1000;
export const NEAREST_STATION_RADIUS_KM = 80;

/** Types véhicule sans estimation carburant Régie. */
export const NON_FUEL_VEHICLE_TYPES = new Set([
  "electric",
  "pluginhybrid",
  "plug-in hybrid",
  "plug_in_hybrid",
  "phev",
  "bev",
]);

export type ParsedStationRow = {
  name: string;
  banner: string | null;
  address: string;
  region: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  prices: Partial<Record<RegieFuelType, number>>;
  externalKey: string;
};

export type ParseSkipReason =
  "empty_row" | "missing_name" | "missing_location" | "no_valid_price";

export type ParseResult = {
  stations: ParsedStationRow[];
  skipped: Array<{ row: number; reason: ParseSkipReason }>;
  sheetName: string;
};

export function normalizeKeyPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildExternalKey(input: {
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}): string {
  const name = normalizeKeyPart(input.name);
  const address = normalizeKeyPart(input.address);
  let raw = `${name}|${address}`;
  if (!address && input.latitude != null && input.longitude != null) {
    raw = `${name}|${input.latitude.toFixed(5)},${input.longitude.toFixed(5)}`;
  }
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/**
 * « 179.9¢ » → 1.799 ; « N/D » / vide → null.
 */
export function parseCentsPrice(raw: unknown): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text || /^n\s*\/\s*d$/i.test(text) || /^n\.?\s*d\.?$/i.test(text)) {
    return null;
  }
  const cleaned = text
    .replace(/¢/g, "")
    .replace(/\u00a0/g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const cents = Number(cleaned);
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return Math.round((cents / 100) * 1000) / 1000;
}

/**
 * Mappe le fuel_type catalogue véhicule → type Régie, ou null si N/A.
 */
export function mapVehicleFuelToRegie(
  vehicleFuelType: string | null | undefined,
): RegieFuelType | null | "not_applicable" {
  if (!vehicleFuelType?.trim()) return "regular";
  const key = vehicleFuelType.trim().toLowerCase().replace(/\s+/g, "");
  if (
    NON_FUEL_VEHICLE_TYPES.has(key) ||
    NON_FUEL_VEHICLE_TYPES.has(vehicleFuelType.trim().toLowerCase())
  ) {
    return "not_applicable";
  }
  if (key === "diesel") return "diesel";
  if (key === "premium" || key === "super") return "premium";
  if (
    key === "gasoline" ||
    key === "hybrid" ||
    key === "essence" ||
    key === "regular"
  ) {
    return "regular";
  }
  // Propane et autres : pas de prix Régie → repli chaîne
  return null;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatRelativeFr(from: Date, now = new Date()): string {
  const ms = Math.max(0, now.getTime() - from.getTime());
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / 60000));
    return `il y a ${mins} min`;
  }
  if (hours < 48) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
