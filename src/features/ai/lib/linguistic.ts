/**
 * Détection / normalisation d’anglicismes interdits (hors noms propres).
 */

const FORBIDDEN_PATTERNS: Array<{
  re: RegExp;
  replacement: string;
  code: string;
}> = [
  {
    re: /\btrajet\s+outbound\b/gi,
    replacement: "trajet aller",
    code: "outbound",
  },
  {
    re: /\btrajet\s+inbound\b/gi,
    replacement: "trajet retour",
    code: "inbound",
  },
  { re: /\boutbound\b/gi, replacement: "trajet aller", code: "outbound" },
  { re: /\binbound\b/gi, replacement: "trajet retour", code: "inbound" },
  {
    re: /\bfuel\s*stops?\b/gi,
    replacement: "arrêts de ravitaillement",
    code: "fuel_stop",
  },
  {
    re: /\bcurrent\s+location\b/gi,
    replacement: "position actuelle",
    code: "current_location",
  },
  {
    re: /\bfast\s*food\b/gi,
    replacement: "restauration rapide",
    code: "fast_food",
  },
  {
    re: /\bfine\s*dining\b/gi,
    replacement: "cuisine gastronomique",
    code: "fine_dining",
  },
  { re: /\bETA\b/g, replacement: "heure d’arrivée estimée", code: "eta" },
  { re: /\bschedule\b/gi, replacement: "horaire", code: "schedule" },
  { re: /\bweather\b/gi, replacement: "météo", code: "weather" },
  {
    re: /\brecommendation\b/gi,
    replacement: "recommandation",
    code: "recommendation",
  },
  {
    re: /(^|[^\w])food([^\w]|$)/gi,
    replacement: "$1restauration$2",
    code: "food",
  },
  { re: /\btrip\b/gi, replacement: "voyage", code: "trip" },
];

export type LinguisticIssue = {
  code: string;
  sample: string;
};

export function findForbiddenAnglicisms(text: string): LinguisticIssue[] {
  const issues: LinguisticIssue[] = [];
  for (const { re, code } of FORBIDDEN_PATTERNS) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m) {
      issues.push({ code, sample: m[0] });
    }
  }
  return issues;
}

/**
 * Remplacement sûr des termes connus — ne touche pas aux URL ni aux noms entre guillemets.
 */
export function normalizeFrenchAnglicisms(text: string): string {
  let out = text;
  for (const { re, replacement } of FORBIDDEN_PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, replacement);
  }
  return out;
}

export function collectTextsForLinguisticScan(payload: {
  answer?: string;
  summary?: string;
  warnings?: Array<{ title?: string; description?: string }>;
  suggestions?: Array<{
    title?: string;
    description?: string;
    reason?: string;
  }>;
  restaurantRecommendations?: Array<{
    shortDescription?: string;
    recommendationReason?: string;
  }>;
}): string {
  const parts: string[] = [];
  if (payload.summary) parts.push(payload.summary);
  if (payload.answer) parts.push(payload.answer);
  for (const w of payload.warnings ?? []) {
    if (w.title) parts.push(w.title);
    if (w.description) parts.push(w.description);
  }
  for (const s of payload.suggestions ?? []) {
    if (s.title) parts.push(s.title);
    if (s.description) parts.push(s.description);
    if (s.reason) parts.push(s.reason);
  }
  for (const r of payload.restaurantRecommendations ?? []) {
    if (r.shortDescription) parts.push(r.shortDescription);
    if (r.recommendationReason) parts.push(r.recommendationReason);
  }
  return parts.join("\n");
}

export function applySafeLinguisticNormalization<
  T extends {
    answer: string;
    summary: string;
    warnings: Array<{
      title: string;
      description: string;
      code: string;
      severity: string;
    }>;
    suggestions: Array<{
      title: string;
      description: string;
      reason: string;
      [key: string]: unknown;
    }>;
    restaurantRecommendations?: Array<{
      shortDescription: string;
      recommendationReason: string;
      name: string;
      [key: string]: unknown;
    }>;
  },
>(response: T): T {
  return {
    ...response,
    summary: normalizeFrenchAnglicisms(response.summary),
    answer: normalizeFrenchAnglicisms(response.answer),
    warnings: response.warnings.map((w) => ({
      ...w,
      title: normalizeFrenchAnglicisms(w.title),
      description: normalizeFrenchAnglicisms(w.description),
    })),
    suggestions: response.suggestions.map((s) => ({
      ...s,
      title: normalizeFrenchAnglicisms(s.title),
      description: normalizeFrenchAnglicisms(s.description),
      reason: normalizeFrenchAnglicisms(s.reason),
    })),
    restaurantRecommendations: (response.restaurantRecommendations ?? []).map(
      (r) => ({
        ...r,
        // ne pas normaliser le nom de l’établissement
        shortDescription: normalizeFrenchAnglicisms(r.shortDescription),
        recommendationReason: normalizeFrenchAnglicisms(r.recommendationReason),
      }),
    ),
  };
}
