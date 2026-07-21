import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { AiSource } from "@/features/ai/schemas/sources";
import { isOfficialMichelinUrl } from "@/features/ai/lib/safe-urls";

const MICHELIN_CLAIM_RE =
  /\b(étoile|etoile|bib gourmand|michelin|guide michelin)\b/i;

/**
 * Neutralise les distinctions Michelin non soutenues par une source officielle.
 */
export function enforceMichelinVerification(
  response: TripAssistantResponse,
  sources: AiSource[],
): TripAssistantResponse {
  const hasOfficialMichelin = sources.some((s) => isOfficialMichelinUrl(s.url));

  const restaurantRecommendations = (
    response.restaurantRecommendations ?? []
  ).map((r) => {
    if (!r.distinction) return r;
    if (r.distinction.verified && !hasOfficialMichelin) {
      return {
        ...r,
        distinction: {
          ...r.distinction,
          verified: false,
          sourceId: null,
        },
        verificationRequired: true,
      };
    }
    if (
      r.distinction.verified &&
      r.distinction.sourceId &&
      !sources.some(
        (s) => s.id === r.distinction!.sourceId && isOfficialMichelinUrl(s.url),
      )
    ) {
      return {
        ...r,
        distinction: {
          ...r.distinction,
          verified: false,
          sourceId: null,
        },
        verificationRequired: true,
      };
    }
    return r;
  });

  let answer = response.answer;
  if (!hasOfficialMichelin && MICHELIN_CLAIM_RE.test(answer)) {
    answer = `${answer.trim()}\n\nNote : la distinction Michelin mentionnée n’a pas pu être confirmée via une source officielle du Guide Michelin. À vérifier avant de la considérer comme un fait.`;
  }

  return {
    ...response,
    answer,
    restaurantRecommendations,
  };
}

/**
 * Fusionne sources modèle + citations API (priorité aux citations API).
 */
export function mergeAndSanitizeSources(
  modelSources: AiSource[] | undefined,
  citationSources: AiSource[],
): AiSource[] {
  const byUrl = new Map<string, AiSource>();
  for (const s of [...citationSources, ...(modelSources ?? [])]) {
    const key = s.url.replace(/\/$/, "").toLowerCase();
    if (!byUrl.has(key)) byUrl.set(key, s);
  }
  return [...byUrl.values()].slice(0, 12).map((s, idx) => ({
    ...s,
    id: `src-${idx + 1}`,
  }));
}
