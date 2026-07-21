/**
 * Validation d’URL pour sources IA — https uniquement, hors réseaux privés.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function isPrivateIp(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(h) || BLOCKED_HOSTS.has(hostname)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^fc00:/i.test(h) || /^fe80:/i.test(h)) return true;
  return false;
}

export function isSafeHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    if (!u.hostname || isPrivateIp(u.hostname)) return false;
    if (u.username || u.password) return false;
    return true;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function classifySourceType(
  url: string,
):
  | "official"
  | "guide"
  | "reservation"
  | "tourism"
  | "review"
  | "maps"
  | "michelin"
  | "directory"
  | "other" {
  const domain = (extractDomain(url) ?? "").toLowerCase();
  if (
    domain.includes("guide.michelin") ||
    domain.includes("michelin.com") ||
    domain.endsWith("michelin.ca")
  ) {
    return "michelin";
  }
  if (
    domain.includes("google.com/maps") ||
    domain.includes("maps.google") ||
    domain.includes("goo.gl/maps")
  ) {
    return "maps";
  }
  if (
    domain.includes("tripadvisor") ||
    domain.includes("yelp.") ||
    domain.includes("pagesjaunes")
  ) {
    return domain.includes("pagesjaunes") ? "directory" : "review";
  }
  if (
    domain.includes("opentable") ||
    domain.includes("resy.com") ||
    domain.includes("thefork") ||
    domain.includes("bookatable")
  ) {
    return "reservation";
  }
  if (
    domain.includes("tourisme") ||
    domain.includes("quebecoriginal") ||
    domain.includes("bonjourquebec") ||
    domain.includes("attraction")
  ) {
    return "tourism";
  }
  if (
    domain.endsWith(".qc.ca") ||
    domain.endsWith(".gouv.qc.ca") ||
    domain.endsWith(".gc.ca")
  ) {
    return "official";
  }
  return "other";
}

export function isOfficialMichelinUrl(url: string): boolean {
  const domain = (extractDomain(url) ?? "").toLowerCase();
  return (
    domain.includes("guide.michelin") ||
    domain === "michelin.com" ||
    domain.endsWith(".michelin.com") ||
    domain.endsWith(".michelin.ca")
  );
}
