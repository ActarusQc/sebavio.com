/**
 * Jeton Google Search Console (méthode balise meta).
 * Jamais de valeur en dur : uniquement via `GOOGLE_SITE_VERIFICATION`.
 * La vérification DNS TXT existante sur sebavia.com reste la méthode primaire.
 */
export function getGoogleSiteVerificationToken(): string | undefined {
  const raw = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if (!raw) return undefined;
  // Refuse les valeurs clairement invalides / placeholders.
  if (raw.length < 8 || raw.length > 200) return undefined;
  if (/[\s<>"']/.test(raw)) return undefined;
  return raw;
}

export function buildGoogleSiteVerificationMetadata():
  { google: string } | undefined {
  const token = getGoogleSiteVerificationToken();
  if (!token) return undefined;
  return { google: token };
}
