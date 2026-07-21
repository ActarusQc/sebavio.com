import { AppError } from "@/lib/errors";

/** VIN ISO 3779 : 17 caractères, sans I/O/Q. */
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function normalizeVin(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidVin(raw: string): boolean {
  return VIN_PATTERN.test(normalizeVin(raw));
}

export function validateVinOrThrow(raw: string): string {
  const vin = normalizeVin(raw);
  if (!VIN_PATTERN.test(vin)) {
    throw new AppError(
      "VIN_001",
      "VIN invalide (17 caractères, sans I, O ni Q).",
      400,
    );
  }
  return vin;
}
