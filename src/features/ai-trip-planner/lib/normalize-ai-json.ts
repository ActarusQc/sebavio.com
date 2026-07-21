const BUDGET_ALIASES: Record<
  string,
  "low" | "moderate" | "comfortable" | "premium"
> = {
  low: "low",
  économique: "low",
  economique: "low",
  "low-budget": "low",
  moderate: "moderate",
  modéré: "moderate",
  modere: "moderate",
  moyen: "moderate",
  comfortable: "comfortable",
  confortable: "comfortable",
  premium: "premium",
  luxe: "premium",
};

function emptyToNull(v: unknown): unknown {
  if (v === "") return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [];
}

function normalizePlace(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const name = raw.trim();
    return name
      ? {
          name,
          placeId: null,
          latitude: null,
          longitude: null,
          city: null,
          province: null,
          postalCode: null,
          country: null,
          isHome: false,
        }
      : null;
  }
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    name: emptyToNull(o.name ?? o.label ?? null),
    label: emptyToNull(o.label ?? null),
    placeId: null, // jamais depuis l’IA
    latitude: null,
    longitude: null,
    city: emptyToNull(o.city ?? null),
    province: emptyToNull(o.province ?? o.region ?? null),
    postalCode: emptyToNull(o.postalCode ?? o.postal_code ?? null),
    country: emptyToNull(o.country ?? null),
    isHome: Boolean(o.isHome),
  };
}

function normalizeBudget(raw: unknown): unknown {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  return BUDGET_ALIASES[key] ?? null;
}

/**
 * Normalise une réponse IA brute avant validation Zod (niveau 2).
 */
export function normalizeTripPlanningAiJson(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const obj = { ...(raw as Record<string, unknown>) };

  if (typeof obj.assistantMessage !== "string") {
    const alt =
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.answer === "string" && obj.answer) ||
      (typeof obj.content === "string" && obj.content);
    if (alt) obj.assistantMessage = alt;
  }

  if (!Array.isArray(obj.missingFields)) obj.missingFields = [];
  if (!Array.isArray(obj.quickReplies)) obj.quickReplies = [];
  obj.missingFields = asArray(obj.missingFields)
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.slice(0, 80))
    .slice(0, 30);
  obj.quickReplies = asArray(obj.quickReplies)
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.slice(0, 80))
    .slice(0, 12);

  const status = obj.sessionStatus;
  if (
    status !== "collecting" &&
    status !== "proposing" &&
    status !== "ready_for_confirmation" &&
    status !== "created" &&
    status !== "abandoned"
  ) {
    obj.sessionStatus = "collecting";
  }

  const draftSource =
    obj.tripDraftPatch && typeof obj.tripDraftPatch === "object"
      ? obj.tripDraftPatch
      : obj.tripDraft;

  if (
    draftSource &&
    typeof draftSource === "object" &&
    !Array.isArray(draftSource)
  ) {
    const d = { ...(draftSource as Record<string, unknown>) };
    if ("origin" in d) d.origin = normalizePlace(d.origin);
    if ("destination" in d) d.destination = normalizePlace(d.destination);
    d.budgetLevel = normalizeBudget(d.budgetLevel);
    d.travelStyle = asArray(d.travelStyle);
    d.preferences = asArray(d.preferences);
    d.constraints = asArray(d.constraints);
    d.stops = asArray(d.stops);
    d.activities = asArray(d.activities);
    d.suggestions = asArray(d.suggestions);
    d.softWarnings = asArray(d.softWarnings);
    for (const key of [
      "title",
      "departureDate",
      "returnDate",
      "vehicleLabel",
      "lodgingType",
      "pace",
    ]) {
      if (key in d) d[key] = emptyToNull(d[key]);
    }
    // IDs inventés → null
    if (typeof d.vehicleId === "string" && d.vehicleId.length < 30) {
      d.vehicleId = null;
    }
    if (obj.tripDraftPatch) obj.tripDraftPatch = d;
    else obj.tripDraft = d;
  }

  if (obj.requestedInput && typeof obj.requestedInput === "object") {
    const ri = { ...(obj.requestedInput as Record<string, unknown>) };
    if (!ri.countryBias) ri.countryBias = "CA";
    if (!ri.regionBias) ri.regionBias = "QC";
    obj.requestedInput = ri;
  }

  if (!Array.isArray(obj.suggestions)) obj.suggestions = [];
  if (!Array.isArray(obj.destinationIdeas)) {
    // ok
  }

  return obj;
}
