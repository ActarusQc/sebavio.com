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

export const PASSWORD_MIN_LENGTH = 8;
