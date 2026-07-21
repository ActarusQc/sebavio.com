import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { parse } from "csv-parse";
import { cellAt, mapHeaders } from "../domain/columns";
import {
  buildSourceKey,
  normalizeFuelType,
  normalizeSearchText,
  normalizeTransmission,
  parseLocaleNumber,
  parseOptionalInt,
  trimCell,
} from "../domain/normalize";
import { validateCatalogRow } from "../domain/validate";
import type {
  CatalogResourceKind,
  NormalizedCatalogRow,
  OfficialCatalogResource,
  RowValidationIssue,
} from "../domain/types";
import { SOURCE_NAME } from "./config";

async function readCsvText(filePath: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  const buf = await readFile(filePath);
  if (
    buf.length >= 3 &&
    buf[0] === 0xef &&
    buf[1] === 0xbb &&
    buf[2] === 0xbf
  ) {
    return buf.subarray(3).toString("utf8");
  }
  const asUtf8 = buf.toString("utf8");
  const asLatin1 = buf.toString("latin1");
  if (asUtf8.includes("\uFFFD")) return asLatin1;
  // Fichiers FR NRCan : accents en latin1 (ex. Année)
  if (
    /Ann.e mod/i.test(asLatin1.slice(0, 120)) &&
    !/Année mod/i.test(asUtf8.slice(0, 120))
  ) {
    return asLatin1;
  }
  return asUtf8;
}

function rowToObject(headers: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < headers.length; i += 1) {
    out[headers[i] ?? `col_${i}`] = row[i] ?? "";
  }
  return out;
}

function normalizeRow(
  row: string[],
  headers: string[],
  resource: OfficialCatalogResource,
  kind: CatalogResourceKind,
): { row: NormalizedCatalogRow | null; issue: string | null } {
  const map = mapHeaders(headers);
  const year = parseOptionalInt(cellAt(row, map, "modelYear"));
  const make = trimCell(cellAt(row, map, "make"));
  const model = trimCell(cellAt(row, map, "model"));
  if (year == null || !make || !model) {
    return { row: null, issue: "Champs obligatoires manquants" };
  }

  const vehicleClass = trimCell(cellAt(row, map, "vehicleClass"));
  const engineSizeLitres = parseLocaleNumber(
    cellAt(row, map, "engineSizeLitres"),
  );
  const cylinders = parseOptionalInt(cellAt(row, map, "cylinders"));
  const transmissionRaw = cellAt(row, map, "transmission");
  const { label: transmission, code: transmissionCode } =
    normalizeTransmission(transmissionRaw);

  const isBev = kind === "bev";
  const isPhev = kind === "phev";

  const fuelRaw =
    cellAt(row, map, "fuelType") ??
    cellAt(row, map, "fuelType2") ??
    cellAt(row, map, "fuelType1");

  const normalizedFuelType = normalizeFuelType(fuelRaw, {
    isBev,
    isPhev,
    modelName: model,
  });

  let cityConsumptionL100Km = parseLocaleNumber(cellAt(row, map, "cityL100"));
  let highwayConsumptionL100Km = parseLocaleNumber(
    cellAt(row, map, "highwayL100"),
  );
  let combinedConsumptionL100Km = parseLocaleNumber(
    cellAt(row, map, "combinedL100"),
  );

  // BEV : colonnes Le/100 peuvent être mappées — préférer kWh pour l'électrique
  const combinedKwh = parseLocaleNumber(cellAt(row, map, "combinedKwh"));
  const cityKwh = parseLocaleNumber(cellAt(row, map, "cityKwh"));
  const electricConsumptionKwh100Km = combinedKwh ?? cityKwh;

  if (isBev) {
    // Les L/100 BEV sont des équivalents essence — les garder si présents
  }

  const combinedMpg = parseLocaleNumber(cellAt(row, map, "combinedMpg"));
  const co2EmissionsGKm = parseOptionalInt(cellAt(row, map, "co2Emissions"));
  const co2Rating = parseOptionalInt(cellAt(row, map, "co2Rating"));
  const smogRating = parseOptionalInt(cellAt(row, map, "smogRating"));
  const electricRangeKm =
    parseOptionalInt(cellAt(row, map, "rangeKm")) ??
    parseOptionalInt(cellAt(row, map, "range1Km"));

  const makeNormalized = normalizeSearchText(make);
  const modelNormalized = normalizeSearchText(model);
  const configurationParts = [
    transmissionCode ?? transmission,
    engineSizeLitres != null ? `${engineSizeLitres}L` : null,
    cylinders != null ? `${cylinders}cyl` : null,
    fuelRaw,
  ].filter(Boolean);
  const configuration =
    configurationParts.length > 0 ? configurationParts.join(" / ") : null;

  const sourceKey = buildSourceKey({
    modelYear: year,
    makeNormalized,
    modelNormalized,
    configuration,
    engineSizeLitres,
    cylinders,
    transmissionCode,
    fuelType: fuelRaw,
    vehicleClass,
  });

  // Pour BEV sans L/100 utile, ne pas forcer 0
  if (isBev && combinedConsumptionL100Km === 0) {
    combinedConsumptionL100Km = null;
    cityConsumptionL100Km = null;
    highwayConsumptionL100Km = null;
  }

  const normalized: NormalizedCatalogRow = {
    sourceKey,
    modelYear: year,
    make,
    makeNormalized,
    model,
    modelNormalized,
    configuration,
    vehicleClass,
    engineSizeLitres,
    cylinders,
    transmission,
    transmissionCode,
    fuelType: trimCell(fuelRaw),
    normalizedFuelType,
    cityConsumptionL100Km,
    highwayConsumptionL100Km,
    combinedConsumptionL100Km,
    combinedMpg,
    co2EmissionsGKm,
    co2Rating,
    smogRating,
    electricConsumptionKwh100Km,
    electricRangeKm,
    sourceName: SOURCE_NAME,
    sourceDataset: resource.name,
    sourceResourceUrl: resource.url,
    sourceYear: year,
    rawData: rowToObject(headers, row),
  };

  return { row: normalized, issue: null };
}

export type ParseCsvResult = {
  rows: NormalizedCatalogRow[];
  rejected: RowValidationIssue[];
  recordsRead: number;
};

export async function parseCatalogCsvFile(
  filePath: string,
  resource: OfficialCatalogResource,
): Promise<ParseCsvResult> {
  const text = await readCsvText(filePath);
  const parser = parse(text, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });

  let headers: string[] | null = null;
  let kind: CatalogResourceKind = resource.kind;
  const rows: NormalizedCatalogRow[] = [];
  const rejected: RowValidationIssue[] = [];
  let recordsRead = 0;
  let rowNumber = 0;

  for await (const record of parser as AsyncIterable<string[]>) {
    rowNumber += 1;
    if (!headers) {
      headers = record.map((h) => String(h ?? "").trim());
      if (kind === "unknown") {
        kind = inferKindFromHeaders(headers);
      }
      continue;
    }
    if (record.every((c) => !String(c ?? "").trim())) continue;
    recordsRead += 1;
    const { row, issue } = normalizeRow(record, headers, resource, kind);
    if (!row) {
      rejected.push({
        reason: issue ?? "Ligne invalide",
        rowNumber,
      });
      continue;
    }
    const validation = validateCatalogRow(row, rowNumber);
    if (validation) {
      rejected.push(validation);
      continue;
    }
    rows.push(row);
  }

  return { rows, rejected, recordsRead };
}

/** Détecte le kind depuis le contenu si le détecteur d'URL a échoué. */
export function inferKindFromHeaders(headers: string[]): CatalogResourceKind {
  const joined = headers.join(" ").toLowerCase();
  if (joined.includes("kwh/100")) return "bev";
  if (joined.includes("fuel type 1") || joined.includes("range 1"))
    return "phev";
  return "conventional";
}

/** Lecture d'un échantillon texte (tests). */
export async function readFirstLines(
  filePath: string,
  maxLines: number,
): Promise<string[]> {
  const lines: string[] = [];
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    lines.push(line);
    if (lines.length >= maxLines) break;
  }
  return lines;
}
