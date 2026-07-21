/**
 * Avertissements carburant destinés à l'utilisateur (jamais de diagnostics internes).
 */

export const USER_FUEL_WARNING_COPY = {
  estimate:
    "Les prix du carburant sont estimés à partir des données les plus récentes disponibles et peuvent varier selon la station.",
  mayHaveChanged:
    "Les prix peuvent avoir changé depuis la dernière mise à jour.",
} as const;

/** Motifs techniques à exclure du rendu utilisateur. */
const INTERNAL_WARNING_PATTERNS: RegExp[] = [
  /identifiant de prix partagé/i,
  /couverture corridor/i,
  /stations détectées/i,
  /\d+\s+estimations?\s+(ville|régionales?)/i,
  /\bcandidates?\b/i,
  /valeurs distinctes/i,
  /identifiants de prix/i,
  /points d['']échantillonnage/i,
  /recherches nearby/i,
  /résultats bruts/i,
  /\bprix exacts\b/i,
  /sans prix/i,
  /granularité/i,
  /station_exact|city_estimate|regional_estimate/i,
  /repli sur/i,
  /polyline/i,
  /stratégie métier/i,
  /\bdp\b/i,
  /fallback/i,
  /réponse nearby/i,
  /couverture limitée/i,
  /une seule station/i,
  /traité comme estimation régionale/i,
  /prix vieillissant/i,
];

function isInternalWarning(message: string): boolean {
  const t = message.trim();
  if (!t) return true;
  return INTERNAL_WARNING_PATTERNS.some((re) => re.test(t));
}

function isStalePriceWarning(message: string): boolean {
  return /vieillissant|stale|aging|peuvent? (avoir )?chang/i.test(message);
}

function isRegionalOrEstimateHint(message: string): boolean {
  return /estimation régionale|prix régional|partagé|médiane|statcan|fde régional|estimations régionales/i.test(
    message,
  );
}

function isUserBusinessMessage(message: string): boolean {
  return /impossible|non réalisable|aucun arrêt|autonomie|requis|manuel|aucun prix automatique/i.test(
    message,
  );
}

/**
 * Convertit les warnings bruts du moteur en messages conviviaux uniques.
 */
export function toUserFuelWarnings(
  raw: string[] | null | undefined,
  opts?: { forceEstimateNotice?: boolean; forceStaleNotice?: boolean },
): string[] {
  let needEstimate = Boolean(opts?.forceEstimateNotice);
  let needStale = Boolean(opts?.forceStaleNotice);
  const business: string[] = [];

  for (const w of raw ?? []) {
    const t = w.trim();
    if (!t) continue;
    if (isUserBusinessMessage(t)) {
      if (!business.includes(t)) business.push(t);
      continue;
    }
    if (isStalePriceWarning(t)) {
      needStale = true;
      continue;
    }
    if (isInternalWarning(t) || isRegionalOrEstimateHint(t)) {
      needEstimate = true;
      continue;
    }
    // Message non classifié : ne pas exposer de jargon technique
    needEstimate = true;
  }

  const out: string[] = [];
  if (needStale) out.push(USER_FUEL_WARNING_COPY.mayHaveChanged);
  if (needEstimate) out.push(USER_FUEL_WARNING_COPY.estimate);
  for (const b of business) {
    if (!out.includes(b)) out.push(b);
  }
  return out;
}
