/**
 * URL publique canonique du site (domaine officiel sebavia.com).
 * Ne jamais retomber sur l’ancien domaine sebavio.com.
 */
export const CANONICAL_SITE_ORIGIN = "https://sebavia.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (raw && /^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      // Empêche toute fuite de l’ancien domaine ou de www dans les métadonnées.
      if (
        url.hostname === "sebavio.com" ||
        url.hostname === "www.sebavio.com" ||
        url.hostname === "www.sebavia.com"
      ) {
        return CANONICAL_SITE_ORIGIN;
      }
      return `${url.protocol}//${url.host}`;
    } catch {
      return CANONICAL_SITE_ORIGIN;
    }
  }
  return CANONICAL_SITE_ORIGIN;
}

/** Métadonnées robots pour pages d’auth et flux sensibles (explorables, non indexées). */
export const NOINDEX_FOLLOW_ROBOTS = {
  index: false,
  follow: true,
} as const;
