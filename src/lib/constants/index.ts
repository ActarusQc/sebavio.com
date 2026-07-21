export const USER_ROLES = [
  "user",
  "support",
  "analyst",
  "billing_admin",
  "admin",
  "super_admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Rôles staff (accès portail `/admin`). */
export const STAFF_USER_ROLES = [
  "support",
  "analyst",
  "billing_admin",
  "admin",
  "super_admin",
] as const satisfies readonly UserRole[];

export const USER_STATUSES = ["active", "suspended", "deleted"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** JWT session max age — 30 minutes (révocation rapide). */
export const AUTH_JWT_MAX_AGE_SECONDS = 30 * 60;

/** Rafraîchissement du JWT (re-lecture status en base) — 60 secondes. */
export const AUTH_JWT_UPDATE_AGE_SECONDS = 60;

/** Limite de tentatives de connexion par IP+email. */
export const LOGIN_RATE_LIMIT_MAX = 5;
export const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 60;

/** Rate-limit forgot-password / resend-verification (anti-abus SMTP). */
export const EMAIL_AUTH_RATE_LIMIT_MAX = 3;
export const EMAIL_AUTH_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

/** Rate-limit appels cartographiques externes (géocodage / itinéraire) par utilisateur. */
export const MAPS_RATE_LIMIT_MAX = 30;
export const MAPS_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

/** TTL cache Redis — géocodage (30 jours) et directions (7 jours). */
export const MAPS_GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const MAPS_DIRECTIONS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Rate-limit appels météo externes par utilisateur. */
export const WEATHER_RATE_LIMIT_MAX = 60;
export const WEATHER_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

/** TTL cache Redis — prévisions / conditions météo (défaut 2 h, TTL dynamique selon proximité). */
export const WEATHER_CACHE_TTL_SECONDS = 60 * 60 * 2;

/** Horizon max prévisions (jours civils à partir d'aujourd'hui inclus). */
export const WEATHER_FORECAST_HORIZON_DAYS = 16;

/** Plafond interne d'appels fournisseur / jour (marge sous 1 000 One Call). */
export const WEATHER_MAX_DAILY_CALLS_DEFAULT = 900;

/** Rate-limit estimations carburant (appels FDE) par utilisateur. */
export const FDE_RATE_LIMIT_MAX = 30;
export const FDE_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

/** Rate-limit assistant IA par utilisateur (anti-abus, ajustable via env). */
export const AI_RATE_LIMIT_MAX_DEFAULT = 30;
export const AI_RATE_LIMIT_WINDOW_SECONDS_DEFAULT = 60 * 60;
export const AI_MAX_MESSAGE_CHARS_DEFAULT = 2000;
export const AI_REQUEST_TIMEOUT_MS_DEFAULT = 45_000;
export const AI_MAX_CONTEXT_CHARS_DEFAULT = 24_000;
export const AI_LOCK_TTL_SECONDS = 90;
export const AI_WEB_SEARCH_DAILY_LIMIT_DEFAULT = 20;
export const AI_WEB_SEARCH_MAX_PER_CONVERSATION_DEFAULT = 5;
export const AI_WEB_SEARCH_TIMEOUT_MS_DEFAULT = 90_000;
export const AI_ROUTE_SEARCH_RADIUS_KM_DEFAULT = 50;
export const AI_ROUTE_MAX_DETOUR_KM_DEFAULT = 30;

/**
 * Consommation L/100 km par défaut pour l'estimation automatique.
 * Laisser `undefined` = aucun défaut inventé (l'utilisateur doit renseigner
 * la fiche véhicule). Définir explicitement (ex. 10) pour activer le repli.
 */
export const DEFAULT_VEHICLE_CONSUMPTION_L100: number | undefined = undefined;

export const PASSWORD_MIN_LENGTH = 8;

/** TTL cache Redis — stats dashboard admin (secondes). */
export const ADMIN_DASHBOARD_CACHE_TTL_SECONDS = 90;
export const ADMIN_DASHBOARD_CACHE_KEY = "admin:dashboard:stats";
