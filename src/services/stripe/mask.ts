/**
 * Masquage d'identifiants Stripe pour l'affichage admin / logs.
 * Ne jamais journaliser de numéro de carte ou de secret.
 */

export function maskStripeId(id: string | null | undefined): string {
  if (!id) return "—";
  const trimmed = id.trim();
  if (trimmed.length <= 10) return trimmed;
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

export function maskStripeIdForCopy(id: string | null | undefined): {
  masked: string;
  full: string | null;
} {
  if (!id) return { masked: "—", full: null };
  return { masked: maskStripeId(id), full: id };
}

export function sanitizeStripeMessage(message: string): string {
  return message
    .replace(/sk_(test|live)_[A-Za-z0-9]+/g, "sk_***")
    .replace(/whsec_[A-Za-z0-9]+/g, "whsec_***")
    .replace(/rk_(test|live)_[A-Za-z0-9]+/g, "rk_***")
    .replace(/\b\d{13,19}\b/g, "[card_redacted]");
}
