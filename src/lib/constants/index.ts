export const USER_ROLES = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "suspended", "deleted"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** JWT session max age — 30 minutes (révocation rapide). */
export const AUTH_JWT_MAX_AGE_SECONDS = 30 * 60;

/** Rafraîchissement du JWT (re-lecture status en base) — 60 secondes. */
export const AUTH_JWT_UPDATE_AGE_SECONDS = 60;

/** Limite de tentatives de connexion par IP+email. */
export const LOGIN_RATE_LIMIT_MAX = 5;
export const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 60;

/** Rate-limit appels cartographiques externes (géocodage / itinéraire) par utilisateur. */
export const MAPS_RATE_LIMIT_MAX = 30;
export const MAPS_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

/** TTL cache Redis — géocodage (30 jours) et directions (7 jours). */
export const MAPS_GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const MAPS_DIRECTIONS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Rate-limit appels météo externes par utilisateur. */
export const WEATHER_RATE_LIMIT_MAX = 60;
export const WEATHER_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

/** TTL cache Redis — prévisions / conditions météo (2 h). */
export const WEATHER_CACHE_TTL_SECONDS = 60 * 60 * 2;

/** Horizon max Open-Meteo (jours civils à partir d'aujourd'hui inclus). */
export const WEATHER_FORECAST_HORIZON_DAYS = 16;

export const PASSWORD_MIN_LENGTH = 8;
