import { z } from "zod";
import { AppError } from "@/lib/errors";
import { validateVinOrThrow } from "@/services/maintenance-schedule/vin";

const nhtsaResultSchema = z.object({
  Results: z
    .array(z.record(z.string(), z.union([z.string(), z.number(), z.null()])))
    .min(1),
});

export type VinDecodeConfidence = "high" | "medium" | "low" | "ambiguous";

export type DecodedVehicleIdentity = {
  vin: string;
  manufacturer: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  vehicleType: string | null;
  bodyClass: string | null;
  engine: string | null;
  displacementL: number | null;
  cylinders: number | null;
  fuelType: string | null;
  transmission: string | null;
  drivetrain: string | null;
  /** Poids nominal (kg) si disponible. */
  gvwrKg: number | null;
  plantCountry: string | null;
  confidence: VinDecodeConfidence;
  incomplete: boolean;
  ambiguous: boolean;
  /** Champs manquants importants. */
  missingFields: string[];
  /** Ne jamais traiter comme certain si incomplete ou ambiguous. */
  isCertain: boolean;
  errorCode: string | null;
  errorText: string | null;
};

function pick(
  row: Record<string, string | number | null>,
  key: string,
): string | null {
  const v = row[key];
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "Not Applicable" || s === "null") return null;
  return s;
}

function parseYear(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1900 || n > 2100) return null;
  return n;
}

function parseNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function scoreConfidence(params: {
  make: string | null;
  model: string | null;
  year: number | null;
  errorCode: string | null;
  missing: string[];
}): {
  confidence: VinDecodeConfidence;
  ambiguous: boolean;
  incomplete: boolean;
} {
  const code = params.errorCode ?? "";
  const ambiguous =
    code.includes("8") ||
    code.toLowerCase().includes("incomplete") ||
    (!params.model && Boolean(params.make));

  const incomplete =
    params.missing.length > 0 || !params.make || !params.model || !params.year;

  if (ambiguous) {
    return { confidence: "ambiguous", ambiguous: true, incomplete };
  }
  if (!params.make || !params.model || !params.year) {
    return { confidence: "low", ambiguous: false, incomplete: true };
  }
  if (params.missing.length >= 3) {
    return { confidence: "medium", ambiguous: false, incomplete: true };
  }
  if (params.missing.length > 0) {
    return { confidence: "medium", ambiguous: false, incomplete: true };
  }
  return { confidence: "high", ambiguous: false, incomplete: false };
}

/**
 * Décode un VIN via NHTSA vPIC (serveur uniquement).
 */
export async function decodeVinWithNhtsa(
  rawVin: string,
): Promise<DecodedVehicleIdentity> {
  const vin = validateVinOrThrow(rawVin);
  const base =
    process.env.NHTSA_VPIC_BASE_URL?.trim() || "https://vpic.nhtsa.dot.gov/api";
  const timeoutMs = Number(process.env.NHTSA_VPIC_TIMEOUT_MS ?? 10000) || 10000;

  const url = `${base.replace(/\/$/, "")}/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let json: unknown;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new AppError(
        "VIN_002",
        "Service de décodage VIN temporairement indisponible.",
        502,
      );
    }
    json = await res.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "VIN_002",
      "Service de décodage VIN temporairement indisponible.",
      502,
    );
  } finally {
    clearTimeout(timer);
  }

  const parsed = nhtsaResultSchema.safeParse(json);
  if (!parsed.success) {
    throw new AppError("VIN_002", "Réponse NHTSA invalide.", 502);
  }

  const row = parsed.data.Results[0] as Record<string, string | number | null>;

  const errorCode = pick(row, "ErrorCode");
  const errorText = pick(row, "ErrorText");
  const make = pick(row, "Make");
  const model = pick(row, "Model");
  const year = parseYear(pick(row, "ModelYear"));
  const manufacturer = pick(row, "Manufacturer") ?? pick(row, "Make");
  const trim = pick(row, "Trim") ?? pick(row, "Series");
  const vehicleType = pick(row, "VehicleType");
  const bodyClass = pick(row, "BodyClass");
  const displacementL = parseNumber(pick(row, "DisplacementL"));
  const cylinders = parseNumber(pick(row, "EngineCylinders"));
  const fuelType = pick(row, "FuelTypePrimary");
  const transmission =
    pick(row, "TransmissionStyle") ?? pick(row, "Transmission");
  const drivetrain = pick(row, "DriveType");
  const plantCountry = pick(row, "PlantCountry");
  const engineParts = [
    displacementL != null ? `${displacementL}L` : null,
    cylinders != null ? `${cylinders} cyl` : null,
    pick(row, "EngineModel"),
  ].filter(Boolean);
  const engine = engineParts.length > 0 ? engineParts.join(" ") : null;

  const gvwrRaw = pick(row, "GVWR");
  let gvwrKg: number | null = null;
  if (gvwrRaw) {
    const lbsMatch = gvwrRaw.match(/([\d,]+)\s*lb/i);
    if (lbsMatch?.[1]) {
      const lbs = Number(lbsMatch[1].replace(/,/g, ""));
      if (Number.isFinite(lbs)) gvwrKg = Math.round(lbs * 0.453592);
    }
  }

  const missingFields: string[] = [];
  if (!make) missingFields.push("make");
  if (!model) missingFields.push("model");
  if (!year) missingFields.push("year");
  if (!trim) missingFields.push("trim");
  if (!engine) missingFields.push("engine");
  if (!fuelType) missingFields.push("fuelType");
  if (!transmission) missingFields.push("transmission");

  const scored = scoreConfidence({
    make,
    model,
    year,
    errorCode,
    missing: missingFields,
  });

  // ErrorCode "0" = succès ; codes non nuls = avertissements / erreurs partielles.
  if (errorCode && errorCode !== "0" && !make && !model) {
    throw new AppError("VIN_001", errorText ?? "VIN non décodable.", 400);
  }

  return {
    vin,
    manufacturer,
    make,
    model,
    year,
    trim,
    vehicleType,
    bodyClass,
    engine,
    displacementL,
    cylinders: cylinders != null ? Math.round(cylinders) : null,
    fuelType,
    transmission,
    drivetrain,
    gvwrKg,
    plantCountry,
    confidence: scored.confidence,
    incomplete: scored.incomplete,
    ambiguous: scored.ambiguous,
    missingFields,
    isCertain:
      !scored.incomplete && !scored.ambiguous && scored.confidence === "high",
    errorCode,
    errorText,
  };
}
