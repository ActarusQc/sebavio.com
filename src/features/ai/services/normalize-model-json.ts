import type { AiSource } from "@/features/ai/schemas/sources";
import {
  classifySourceType,
  extractDomain,
  isSafeHttpsUrl,
} from "@/features/ai/lib/safe-urls";

/**
 * Corrige les champs sources / restaurants souvent mal typés avant Zod.
 */
export function normalizeModelJson(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const obj = { ...(raw as Record<string, unknown>) };

  if (Array.isArray(obj.sources)) {
    obj.sources = normalizeSourcesArray(obj.sources);
  }
  if (!Array.isArray(obj.sources)) obj.sources = [];

  if (
    obj.knowledgeMode !== "web_grounded" &&
    obj.knowledgeMode !== "trip_context"
  ) {
    obj.knowledgeMode = obj.webSearchUsed ? "web_grounded" : "trip_context";
  }
  if (typeof obj.webSearchUsed !== "boolean") {
    obj.webSearchUsed = Boolean(obj.webSearchUsed);
  }
  if (!Array.isArray(obj.restaurantRecommendations)) {
    obj.restaurantRecommendations = [];
  } else {
    obj.restaurantRecommendations = normalizeRestaurantRecommendations(
      obj.restaurantRecommendations,
    );
  }
  if (
    obj.clarification != null &&
    typeof obj.clarification === "object" &&
    !Array.isArray(obj.clarification)
  ) {
    const c = obj.clarification as Record<string, unknown>;
    if (c.required !== true) {
      obj.clarification = null;
    }
  } else if (obj.clarification === undefined) {
    obj.clarification = null;
  }
  if (!Array.isArray(obj.warnings)) obj.warnings = [];
  if (!Array.isArray(obj.suggestions)) obj.suggestions = [];
  if (!Array.isArray(obj.missingInformation)) obj.missingInformation = [];

  return obj;
}

function asNullableString(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

function asString(v: unknown, fallback: string, max: number): string {
  const s = asNullableString(v, max);
  return s ?? fallback;
}

function asNullableNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asNullableInt(v: unknown): number | null {
  const n = asNullableNumber(v);
  return n == null ? null : Math.round(n);
}

function normalizeRestaurantRecommendations(items: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const item of items.slice(0, 10)) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = asString(r.name, "", 200);
    const city = asString(r.city, "", 150);
    if (!name || !city) continue;

    const locRaw =
      r.location && typeof r.location === "object" && !Array.isArray(r.location)
        ? (r.location as Record<string, unknown>)
        : {};
    const routeRaw =
      r.routeImpact &&
      typeof r.routeImpact === "object" &&
      !Array.isArray(r.routeImpact)
        ? (r.routeImpact as Record<string, unknown>)
        : {};
    const openRaw =
      r.openingStatus &&
      typeof r.openingStatus === "object" &&
      !Array.isArray(r.openingStatus)
        ? (r.openingStatus as Record<string, unknown>)
        : {};

    const priceRaw = String(r.priceLevel ?? "unknown");
    const priceLevel = (
      [
        "budget",
        "moderate",
        "premium",
        "upscale",
        "fine_dining",
        "unknown",
      ] as const
    ).includes(priceRaw as "unknown")
      ? priceRaw
      : "unknown";

    const openValueRaw = String(openRaw.value ?? "unknown");
    const openMap: Record<string, string> = {
      open: "likely_open",
      opened: "likely_open",
      closed: "closed",
      unknown: "unknown",
      verified_open: "verified_open",
      likely_open: "likely_open",
      likely_closed: "likely_closed",
    };
    const openValue = openMap[openValueRaw] ?? "unknown";

    const locSourceRaw = String(locRaw.source ?? "unverified");
    const locSource = (
      ["official", "maps", "web", "unverified"] as const
    ).includes(locSourceRaw as "unverified")
      ? locSourceRaw
      : "unverified";

    const beforeAfterRaw = String(
      routeRaw.locatedBeforeOrAfterMidpoint ?? "unknown",
    );
    const beforeAfter = (
      ["before", "near", "after", "unknown"] as const
    ).includes(beforeAfterRaw as "unknown")
      ? beforeAfterRaw
      : "unknown";

    let distinction = null;
    if (
      r.distinction &&
      typeof r.distinction === "object" &&
      !Array.isArray(r.distinction)
    ) {
      const d = r.distinction as Record<string, unknown>;
      const label = asNullableString(d.label, 200);
      if (label) {
        distinction = {
          label,
          verified: Boolean(d.verified),
          sourceId: asNullableString(d.sourceId, 80),
        };
      }
    }

    out.push({
      id: asNullableString(r.id, 80) ?? undefined,
      name,
      city,
      category: asNullableString(r.category, 120),
      shortDescription: asString(
        r.shortDescription,
        asString(r.recommendationReason, "Suggestion près du trajet.", 1000),
        1000,
      ),
      recommendationReason: asString(
        r.recommendationReason,
        asString(r.shortDescription, "Suggestion près du trajet.", 1000),
        1000,
      ),
      cuisineType: asNullableString(r.cuisineType, 120),
      priceLevel,
      distinction,
      location: {
        address: asNullableString(locRaw.address, 500),
        latitude: asNullableNumber(locRaw.latitude),
        longitude: asNullableNumber(locRaw.longitude),
        source: locSource,
      },
      routeImpact: {
        distanceFromMidpointKm: asNullableNumber(
          routeRaw.distanceFromMidpointKm,
        ),
        estimatedDetourKm: asNullableNumber(routeRaw.estimatedDetourKm),
        estimatedDetourMinutes: asNullableInt(routeRaw.estimatedDetourMinutes),
        locatedBeforeOrAfterMidpoint: beforeAfter,
      },
      estimatedArrivalTime: asNullableString(r.estimatedArrivalTime, 40),
      estimatedMealDurationMinutes: asNullableInt(
        r.estimatedMealDurationMinutes,
      ),
      openingStatus: {
        value: openValue,
        label: asString(openRaw.label, "Horaire à confirmer", 300),
        verifiedAt: asNullableString(openRaw.verifiedAt, 40),
      },
      openingHoursText: asNullableString(r.openingHoursText, 500),
      rating: asNullableNumber(r.rating),
      ratingCount: asNullableInt(r.ratingCount),
      reservationRecommended: Boolean(r.reservationRecommended),
      verificationRequired:
        r.verificationRequired == null ? true : Boolean(r.verificationRequired),
      verificationNote: asNullableString(r.verificationNote, 500),
      sourceIds: Array.isArray(r.sourceIds)
        ? r.sourceIds
            .filter((x): x is string => typeof x === "string")
            .map((x) => x.slice(0, 80))
            .slice(0, 20)
        : [],
    });
  }
  return out;
}

function normalizeSourcesArray(items: unknown[]): AiSource[] {
  const out: AiSource[] = [];
  let i = 0;
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const url = typeof s.url === "string" ? s.url.trim() : "";
    if (!url || !isSafeHttpsUrl(url)) continue;
    const domain =
      (typeof s.domain === "string" && s.domain.trim()) ||
      extractDomain(url) ||
      "";
    if (!domain) continue;
    i += 1;
    const sourceTypeRaw = typeof s.sourceType === "string" ? s.sourceType : "";
    const sourceType = (
      [
        "official",
        "guide",
        "reservation",
        "tourism",
        "review",
        "maps",
        "michelin",
        "directory",
        "other",
      ] as const
    ).includes(sourceTypeRaw as "other")
      ? (sourceTypeRaw as AiSource["sourceType"])
      : classifySourceType(url);

    out.push({
      id:
        typeof s.id === "string" && s.id.trim()
          ? s.id.trim().slice(0, 80)
          : `src-${i}`,
      title:
        typeof s.title === "string"
          ? s.title.slice(0, 300)
          : s.title == null
            ? null
            : String(s.title).slice(0, 300),
      url,
      domain,
      supportsClaim:
        typeof s.supportsClaim === "string"
          ? s.supportsClaim.slice(0, 500)
          : s.supportsClaim === true
            ? "soutient la recommandation"
            : null,
      sourceType,
    });
  }
  return out.slice(0, 12);
}
