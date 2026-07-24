import type { AnalyticsProperties } from "./types";

const FORBIDDEN_KEY_PATTERN =
  /(email|password|phone|name|address|prompt|message|conversation|stripe|payment|card|iban|ip|gps|lat|lng|latitude|longitude|destination|origin|health|child)/i;

const ALLOWED_KEYS = new Set([
  "path",
  "page_type",
  "channel",
  "landing_path",
  "referrer_host",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "plan_slug",
  "surface",
  "first_visit_date",
]);

/**
 * Nettoie les propriétés : liste blanche + rejet des clés sensibles.
 * Ne journalise jamais une query string complète.
 */
export function sanitizeAnalyticsProperties(
  input: AnalyticsProperties | undefined,
): AnalyticsProperties {
  if (!input) return {};
  const out: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (FORBIDDEN_KEY_PATTERN.test(key)) continue;
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    // Pas de query string ni d’URL absolue contenant des secrets potentiels
    if (trimmed.includes("?") || trimmed.includes("@")) continue;
    if (trimmed.length > 120) continue;
    (out as Record<string, string>)[key] = trimmed;
  }

  return out;
}

/** Extrait un chemin sûr (sans query / hash). */
export function safePathFromLocation(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] || "/";
  return path.length > 200 ? path.slice(0, 200) : path;
}
