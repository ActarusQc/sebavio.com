/**
 * Normalisation d'adresse avant hash de cache.
 * trim + minuscules + espaces multiples → un seul espace ; accents conservés.
 */
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}
