export type PublicPageType =
  | "home"
  | "product"
  | "guides_hub"
  | "guide"
  | "pricing"
  | "institutional"
  | "legal"
  | "other_public";

/** Classifie une URL publique Sebavia (chemin relatif ou absolu). */
export function classifyPublicPageType(urlOrPath: string): PublicPageType {
  let path = urlOrPath;
  try {
    if (/^https?:\/\//i.test(urlOrPath)) {
      path = new URL(urlOrPath).pathname;
    }
  } catch {
    path = urlOrPath;
  }
  const normalized = path.replace(/\/$/, "") || "/";

  if (normalized === "/") return "home";
  if (normalized === "/guides") return "guides_hub";
  if (normalized.startsWith("/guides/")) return "guide";
  if (normalized === "/pricing") return "pricing";
  if (
    normalized === "/confidentialite" ||
    normalized === "/conditions-utilisation"
  ) {
    return "legal";
  }
  if (
    normalized === "/a-propos" ||
    normalized === "/faq" ||
    normalized === "/contact"
  ) {
    return "institutional";
  }
  if (
    normalized === "/fonctionnalites" ||
    normalized === "/assistant-voyage-ia" ||
    normalized === "/planificateur-road-trip-quebec" ||
    normalized === "/calculateur-cout-carburant-voyage" ||
    normalized === "/planifier-arrets-carburant" ||
    normalized === "/meteo-voyage"
  ) {
    return "product";
  }
  return "other_public";
}
