import { createHash } from "node:crypto";
import type { NormalizedFuelType } from "./types";

const ACCENT_MAP: Record<string, string> = {
  à: "a",
  â: "a",
  ä: "a",
  á: "a",
  ã: "a",
  å: "a",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  ö: "o",
  õ: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ý: "y",
  ÿ: "y",
  œ: "oe",
  æ: "ae",
};

export function trimCell(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value)
    .replace(/\u00a0/g, " ")
    .trim();
  if (!s || /^n\/?a$/i.test(s) || s === "-" || s === "—") return null;
  return s;
}

export function stripAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[àâäáãåçèéêëìíîïñòóôöõùúûüýÿœæ]/gi, (ch) => {
      const mapped = ACCENT_MAP[ch.toLowerCase()];
      if (!mapped) return ch;
      return ch === ch.toUpperCase() ? mapped.toUpperCase() : mapped;
    });
}

export function normalizeSearchText(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseLocaleNumber(value: unknown): number | null {
  const raw = trimCell(value);
  if (raw == null) return null;
  // Extraire un nombre éventuellement suivi d'unités (ex. "2.5 (22.3 kWh/100 km)")
  const match = raw.replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const normalized = match[0].replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseOptionalInt(value: unknown): number | null {
  const n = parseLocaleNumber(value);
  if (n == null) return null;
  return Math.round(n);
}

export function normalizeFuelType(
  raw: string | null | undefined,
  context: {
    isBev?: boolean;
    isPhev?: boolean;
    modelName?: string | null;
  } = {},
): NormalizedFuelType | null {
  if (context.isBev) return "electric";
  if (context.isPhev) return "plugin_hybrid";

  const model = normalizeSearchText(context.modelName ?? "");
  const modelIsPlugin =
    /plugin|rechargeable|phev|prime\b/.test(model) &&
    (/hybrid|hybride|prime/.test(model) || /phev/.test(model));
  const modelIsHybrid =
    !modelIsPlugin &&
    (/\bhybrid\b|\bhybride\b/.test(model) || /\bhev\b/.test(model));

  // Conserver le caractère hybride même si le code carburant est X/Z
  if (modelIsPlugin) return "plugin_hybrid";
  if (modelIsHybrid) return "hybrid";

  const cell = trimCell(raw);
  if (!cell) return null;

  const key = normalizeSearchText(cell).replace(/\s+/g, "");
  const upper = cell.trim().toUpperCase();

  if (upper === "X" || key.includes("regular") || key.includes("ordinaire")) {
    return "regular";
  }
  if (upper === "Z" || key.includes("premium") || key.includes("super")) {
    return "premium";
  }
  if (upper === "D" || key.includes("diesel")) return "diesel";
  if (upper === "E" || key.includes("ethanol") || key.includes("e85")) {
    return "ethanol";
  }
  if (
    upper === "N" ||
    key.includes("naturalgas") ||
    key.includes("gaznaturel")
  ) {
    return "natural_gas";
  }
  if (
    upper === "B" ||
    key.includes("electric") ||
    key.includes("electricite") ||
    key.includes("electricity")
  ) {
    return "electric";
  }
  if (
    key.includes("plugin") ||
    key.includes("rechargeable") ||
    key.includes("phev")
  ) {
    return "plugin_hybrid";
  }
  if (key.includes("hybrid") || key.includes("hybride")) return "hybrid";

  return null;
}

export function normalizeTransmission(raw: string | null | undefined): {
  label: string | null;
  code: string | null;
} {
  const cell = trimCell(raw);
  if (!cell) return { label: null, code: null };
  const code = cell.toUpperCase().replace(/\s+/g, "");
  let label = cell;
  if (/^A\d*$/i.test(code) || /^AS\d*$/i.test(code)) label = "automatique";
  else if (/^AM\d*$/i.test(code)) label = "automatisée";
  else if (/^AV\d*$/i.test(code)) label = "CVT";
  else if (/^M\d*$/i.test(code)) label = "manuelle";
  return { label, code };
}

export function buildSourceKey(parts: {
  modelYear: number;
  makeNormalized: string;
  modelNormalized: string;
  configuration: string | null;
  engineSizeLitres: number | null;
  cylinders: number | null;
  transmissionCode: string | null;
  fuelType: string | null;
  vehicleClass: string | null;
}): string {
  const payload = [
    parts.modelYear,
    parts.makeNormalized,
    parts.modelNormalized,
    parts.configuration ?? "",
    parts.engineSizeLitres ?? "",
    parts.cylinders ?? "",
    parts.transmissionCode ?? "",
    normalizeSearchText(parts.fuelType ?? ""),
    parts.vehicleClass ?? "",
  ].join("|");
  return createHash("sha256").update(payload).digest("hex").slice(0, 40);
}

export function fuelTypeLabelFr(type: string | null | undefined): string {
  switch (type) {
    case "regular":
      return "Essence ordinaire";
    case "premium":
      return "Essence super";
    case "diesel":
      return "Diesel";
    case "ethanol":
      return "Éthanol (E85)";
    case "natural_gas":
      return "Gaz naturel";
    case "electric":
      return "Électrique";
    case "hybrid":
      return "Hybride";
    case "plugin_hybrid":
      return "Hybride rechargeable";
    default:
      return type?.trim() || "Non précisé";
  }
}

export function formatConfigurationLabel(input: {
  model: string;
  engineSizeLitres: number | null;
  transmission: string | null;
  normalizedFuelType: string | null;
  combinedConsumptionL100Km: number | null;
  electricRangeKm: number | null;
}): string {
  const parts = [input.model];
  if (input.engineSizeLitres != null) {
    parts.push(`${String(input.engineSizeLitres).replace(".", ",")} L`);
  }
  if (input.transmission) parts.push(input.transmission);
  parts.push(fuelTypeLabelFr(input.normalizedFuelType).toLowerCase());
  if (input.combinedConsumptionL100Km != null) {
    parts.push(
      `${String(input.combinedConsumptionL100Km).replace(".", ",")} L/100 km`,
    );
  } else if (input.electricRangeKm != null) {
    parts.push(`${input.electricRangeKm} km autonomie`);
  }
  return parts.join(" — ");
}
