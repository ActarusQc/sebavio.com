import "server-only";

import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import {
  applySafeLinguisticNormalization,
  collectTextsForLinguisticScan,
  findForbiddenAnglicisms,
  type LinguisticIssue,
} from "@/features/ai/lib/linguistic";

export type LinguisticValidationResult = {
  response: TripAssistantResponse;
  issuesFound: LinguisticIssue[];
  retried: boolean;
  normalized: boolean;
};

/**
 * Validation linguistique légère — journalise codes internes seulement.
 */
export function validateAndNormalizeFrenchResponse(
  response: TripAssistantResponse,
): LinguisticValidationResult {
  const scan = collectTextsForLinguisticScan(response);
  const issues = findForbiddenAnglicisms(scan);
  if (issues.length === 0) {
    return {
      response,
      issuesFound: [],
      retried: false,
      normalized: false,
    };
  }

  console.warn("[ai] linguistic_anglicism", {
    codes: [...new Set(issues.map((i) => i.code))],
    count: issues.length,
  });

  const normalized = applySafeLinguisticNormalization(response);
  return {
    response: normalized,
    issuesFound: issues,
    retried: false,
    normalized: true,
  };
}

export const LINGUISTIC_CORRECTION_INSTRUCTION = `
Correction linguistique obligatoire :
Réécris entièrement answer et summary en français naturel du Québec.
Remplace tout anglicisme évitable (outbound→trajet aller, inbound→trajet retour,
food→restauration/repas, fuel stop→arrêt de ravitaillement, ETA→heure d’arrivée estimée,
schedule→horaire, trip→voyage, weather→météo, current location→position actuelle,
fast food→restauration rapide, fine dining→cuisine gastronomique).
Conserve les noms propres d’établissements, adresses et marques inchangés.
Ne change pas les faits ni les recommandations.
`;
