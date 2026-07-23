/**
 * Courriel public officiel Sebavia.
 * CONTACT_EMAIL (env) peut surcharger pour les environnements non prod.
 */
export const OFFICIAL_PUBLIC_EMAIL = "bonjour@sebavia.com";

export function parseEmailAddress(
  raw: string | undefined | null,
): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  const bracket = trimmed.match(/<([^>]+)>/);
  const candidate = (bracket?.[1] ?? trimmed).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return null;
  return candidate;
}

/**
 * Adresse publique / destinataire contact.
 * Ne dépend JAMAIS de EMAIL_FROM (expéditeur technique SMTP).
 */
export function getPublicSupportEmail(): string {
  return parseEmailAddress(process.env.CONTACT_EMAIL) ?? OFFICIAL_PUBLIC_EMAIL;
}

/** Destinataire inbox du formulaire (= CONTACT_EMAIL / officiel). */
export function getContactInboxEmail(): string {
  return getPublicSupportEmail();
}
