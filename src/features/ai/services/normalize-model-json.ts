import type { AiSource } from "@/features/ai/schemas/sources";
import {
  classifySourceType,
  extractDomain,
  isSafeHttpsUrl,
} from "@/features/ai/lib/safe-urls";

/**
 * Corrige les champs sources souvent mal typés par le modèle avant Zod.
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
  }
  if (!Array.isArray(obj.warnings)) obj.warnings = [];
  if (!Array.isArray(obj.suggestions)) obj.suggestions = [];
  if (!Array.isArray(obj.missingInformation)) obj.missingInformation = [];

  return obj;
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
