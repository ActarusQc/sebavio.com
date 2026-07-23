/**
 * Courriel de soutien public — uniquement depuis la config serveur réelle.
 * Ne jamais inventer d’adresse (ex. support@…) si elle n’existe pas.
 */
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
 * Destinataire des messages contact / confidentialité.
 * Priorité : CONTACT_EMAIL → EMAIL_REPLY_TO → EMAIL_FROM (partie adresse).
 */
export function getPublicSupportEmail(): string | null {
  return (
    parseEmailAddress(process.env.CONTACT_EMAIL) ||
    parseEmailAddress(process.env.EMAIL_REPLY_TO) ||
    parseEmailAddress(process.env.EMAIL_FROM)
  );
}
