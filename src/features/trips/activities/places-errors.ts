/** Erreurs Places API (New) — jamais de clé / réponse complète dans les logs. */

export type PlacesOperation =
  "searchNearby" | "searchText" | "placeDetails" | "placePhoto";

export type PlacesProviderErrorCode =
  | "not_configured"
  | "api_key_service_blocked"
  | "permission_denied"
  | "invalid_argument"
  | "rate_limited"
  | "sebavio_rate_limited"
  | "timeout"
  | "http_error"
  | "network_error"
  | "budget_exhausted";

export type PlacesQuotaLog = {
  provider: "google-places";
  operation: PlacesOperation;
  httpStatus: number | null;
  googleStatus: string | null;
  googleMessage: string | null;
  quotaMetric: string | null;
  quotaLimit: string | null;
  retryAfterSeconds: number | null;
  tripId: string | null;
  generationId: string | null;
  reason: string | null;
};

export class PlacesProviderError extends Error {
  readonly code: PlacesProviderErrorCode;
  readonly httpStatus: number | null;
  readonly quota: PlacesQuotaLog | null;

  constructor(
    code: PlacesProviderErrorCode,
    message: string,
    httpStatus: number | null = null,
    quota: PlacesQuotaLog | null = null,
  ) {
    super(message);
    this.name = "PlacesProviderError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.quota = quota;
  }
}

export function userFacingPlacesError(error: PlacesProviderError): string {
  switch (error.code) {
    case "api_key_service_blocked":
      return "Google Places est bloqué sur la clé serveur (API_KEY_SERVICE_BLOCKED). Dans Google Cloud → Identifiants → clé serveur, autorisez « Places API (New) », puis actualisez les suggestions.";
    case "not_configured":
      return "Clé Google Places serveur absente. Configurez GOOGLE_PLACES_SERVER_API_KEY ou GOOGLE_MAPS_API_KEY.";
    case "permission_denied":
      return "Accès Google Places refusé. Vérifiez la facturation et les restrictions de la clé serveur.";
    case "invalid_argument":
      return "Requête Google Places invalide (types ou FieldMask). Réessayez après correction.";
    case "rate_limited":
      return "Quota Google Places temporairement atteint. Réessayez dans quelques minutes.";
    case "sebavio_rate_limited":
      return "Limite temporaire de recherches d'activités atteinte. Réessayez dans quelques minutes.";
    case "budget_exhausted":
      return "Recherche partielle : budget d'appels Google atteint pour cette génération.";
    case "timeout":
      return "Délai dépassé lors de l'appel Google Places. Réessayez.";
    default:
      return "Les suggestions d'activités sont temporairement indisponibles (Google Places).";
  }
}

type GoogleErrorDetail = {
  reason?: string;
  domain?: string;
  metadata?: Record<string, string>;
  "@type"?: string;
  locale?: string;
  message?: string;
};

type GoogleErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: GoogleErrorDetail[];
  };
};

function extractQuotaFields(details: GoogleErrorDetail[] | undefined): {
  reason: string | null;
  quotaMetric: string | null;
  quotaLimit: string | null;
} {
  if (!details?.length) {
    return { reason: null, quotaMetric: null, quotaLimit: null };
  }
  let reason: string | null = null;
  let quotaMetric: string | null = null;
  let quotaLimit: string | null = null;
  for (const d of details) {
    if (d.reason && !reason) reason = d.reason;
    const meta = d.metadata ?? {};
    // Champs fréquents Google / Cloud Quotas
    quotaMetric =
      quotaMetric ??
      meta.quota_metric ??
      meta.quotaMetric ??
      meta.consumerQuotaMetric ??
      null;
    quotaLimit =
      quotaLimit ??
      meta.quota_limit ??
      meta.quotaLimit ??
      meta.quota_limit_value ??
      null;
  }
  return { reason, quotaMetric, quotaLimit };
}

export function logPlacesQuotaEvent(log: PlacesQuotaLog): void {
  console.warn("[trip-activities] places-quota", {
    provider: log.provider,
    operation: log.operation,
    httpStatus: log.httpStatus,
    googleStatus: log.googleStatus,
    googleMessage: log.googleMessage ? log.googleMessage.slice(0, 200) : null,
    quotaMetric: log.quotaMetric,
    quotaLimit: log.quotaLimit,
    retryAfterSeconds: log.retryAfterSeconds,
    tripId: log.tripId,
    generationId: log.generationId,
    reason: log.reason,
  });
}

export function parsePlacesHttpError(
  status: number,
  bodyText: string,
  context: {
    operation: PlacesOperation;
    tripId?: string | null;
    generationId?: string | null;
    retryAfterHeader?: string | null;
  },
): PlacesProviderError {
  let googleStatus: string | null = null;
  let googleMessage: string | null = null;
  let reason: string | null = null;
  let quotaMetric: string | null = null;
  let quotaLimit: string | null = null;

  try {
    const parsed = JSON.parse(bodyText) as GoogleErrorBody;
    googleStatus = parsed.error?.status ?? null;
    googleMessage = parsed.error?.message ?? null;
    const extracted = extractQuotaFields(parsed.error?.details);
    reason = extracted.reason ?? googleStatus;
    quotaMetric = extracted.quotaMetric;
    quotaLimit = extracted.quotaLimit;
  } catch {
    googleMessage = bodyText.slice(0, 200);
  }

  let retryAfterSeconds: number | null = null;
  if (context.retryAfterHeader) {
    const n = Number(context.retryAfterHeader);
    if (Number.isFinite(n) && n >= 0) retryAfterSeconds = Math.round(n);
  }

  const quotaLog: PlacesQuotaLog = {
    provider: "google-places",
    operation: context.operation,
    httpStatus: status,
    googleStatus,
    googleMessage,
    quotaMetric,
    quotaLimit,
    retryAfterSeconds,
    tripId: context.tripId ?? null,
    generationId: context.generationId ?? null,
    reason,
  };
  logPlacesQuotaEvent(quotaLog);

  if (
    reason === "API_KEY_SERVICE_BLOCKED" ||
    /are blocked/i.test(googleMessage ?? "")
  ) {
    return new PlacesProviderError(
      "api_key_service_blocked",
      "Places API (New) bloquée sur la clé API serveur",
      status,
      quotaLog,
    );
  }
  if (
    status === 429 ||
    reason === "RATE_LIMIT_EXCEEDED" ||
    reason === "RESOURCE_EXHAUSTED" ||
    googleStatus === "RESOURCE_EXHAUSTED"
  ) {
    return new PlacesProviderError(
      "rate_limited",
      "Quota Places Google dépassé",
      status,
      quotaLog,
    );
  }
  if (status === 400) {
    return new PlacesProviderError(
      "invalid_argument",
      "Requête Places invalide",
      status,
      quotaLog,
    );
  }
  if (status === 403) {
    return new PlacesProviderError(
      "permission_denied",
      "Permission Places refusée",
      status,
      quotaLog,
    );
  }
  return new PlacesProviderError(
    "http_error",
    `Places HTTP ${status}`,
    status,
    quotaLog,
  );
}
