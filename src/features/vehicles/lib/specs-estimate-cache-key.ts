/** Normalise une chaîne pour clé de cache (lowercase, trim, espaces compressés). */
export function normalizeSpecToken(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Clé de cache partagée.
 * Priorité : catalog:<uuid> si catalogEntryId, sinon make|model|year|configuration.
 */
export function buildSpecsEstimateCacheKey(input: {
  catalogEntryId?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  configuration?: string | null;
}): string {
  if (input.catalogEntryId) {
    return `catalog:${input.catalogEntryId}`;
  }
  const make = normalizeSpecToken(input.make);
  const model = normalizeSpecToken(input.model);
  const year =
    input.year != null && Number.isFinite(input.year) ? String(input.year) : "";
  const configuration = normalizeSpecToken(input.configuration);
  return [make, model, year, configuration].join("|");
}
