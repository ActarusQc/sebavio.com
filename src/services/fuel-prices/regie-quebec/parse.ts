import * as XLSX from "xlsx";
import {
  buildExternalKey,
  parseCentsPrice,
  type ParseResult,
  type ParseSkipReason,
  type ParsedStationRow,
  type RegieFuelType,
} from "./constants";

const HEADER_MAP: Record<string, string> = {
  nom: "name",
  banniere: "banner",
  bannière: "banner",
  adresse: "address",
  region: "region",
  région: "region",
  "code postal": "postalCode",
  latitude: "latitude",
  longitude: "longitude",
  "prix regulier": "regular",
  "prix régulier": "regular",
  "prix super": "premium",
  "prix diesel": "diesel",
};

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n =
    typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse un buffer / fichier Excel Régie Essence Québec.
 */
export function parseRegieXlsx(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0] ?? "";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { stations: [], skipped: [], sheetName };
  }

  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (rows.length === 0) {
    return { stations: [], skipped: [], sheetName };
  }

  const headerRow = rows[0] ?? [];
  const colIndex: Record<string, number> = {};
  headerRow.forEach((cell, i) => {
    const key = HEADER_MAP[normalizeHeader(cell)];
    if (key) colIndex[key] = i;
  });

  const stations: ParsedStationRow[] = [];
  const skipped: Array<{ row: number; reason: ParseSkipReason }> = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const get = (key: string) =>
      colIndex[key] != null ? row[colIndex[key]!] : null;

    const name = String(get("name") ?? "").trim();
    const address = String(get("address") ?? "").trim();
    const bannerRaw = String(get("banner") ?? "").trim();
    const regionRaw = String(get("region") ?? "").trim();
    const postalRaw = String(get("postalCode") ?? "").trim();
    const latitude = toNumber(get("latitude"));
    const longitude = toNumber(get("longitude"));

    const isEmpty = row.every((c) => c == null || String(c).trim() === "");
    if (isEmpty) {
      skipped.push({ row: r + 1, reason: "empty_row" });
      continue;
    }
    if (!name) {
      skipped.push({ row: r + 1, reason: "missing_name" });
      continue;
    }
    if (!address && (latitude == null || longitude == null)) {
      skipped.push({ row: r + 1, reason: "missing_location" });
      continue;
    }

    const prices: Partial<Record<RegieFuelType, number>> = {};
    const regular = parseCentsPrice(get("regular"));
    const premium = parseCentsPrice(get("premium"));
    const diesel = parseCentsPrice(get("diesel"));
    if (regular != null) prices.regular = regular;
    if (premium != null) prices.premium = premium;
    if (diesel != null) prices.diesel = diesel;

    if (Object.keys(prices).length === 0) {
      skipped.push({ row: r + 1, reason: "no_valid_price" });
      continue;
    }

    stations.push({
      name: name.slice(0, 200),
      banner: bannerRaw ? bannerRaw.slice(0, 120) : null,
      address: (address || `${latitude},${longitude}`).slice(0, 300),
      region: regionRaw ? regionRaw.slice(0, 120) : null,
      postalCode: postalRaw ? postalRaw.slice(0, 20) : null,
      latitude,
      longitude,
      prices,
      externalKey: buildExternalKey({
        name,
        address,
        latitude,
        longitude,
      }),
    });
  }

  return { stations, skipped, sheetName };
}
