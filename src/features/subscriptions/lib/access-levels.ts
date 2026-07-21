/**
 * Niveaux d'accès Sebavio — priorité : admin > plus > pass > découverte.
 */

export const ACCESS_LEVELS = [
  "admin",
  "sebavio_plus",
  "pass_30_jours",
  "decouverte",
] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** Plus le chiffre est élevé, plus le niveau est privilégié. */
export const ACCESS_LEVEL_PRIORITY: Record<AccessLevel, number> = {
  admin: 400,
  sebavio_plus: 300,
  pass_30_jours: 200,
  decouverte: 100,
};

export function compareAccessLevels(a: AccessLevel, b: AccessLevel): number {
  return ACCESS_LEVEL_PRIORITY[a] - ACCESS_LEVEL_PRIORITY[b];
}

export function hasAccessAtLeast(
  current: AccessLevel,
  required: AccessLevel,
): boolean {
  return ACCESS_LEVEL_PRIORITY[current] >= ACCESS_LEVEL_PRIORITY[required];
}

export function isFullAccessLevel(level: AccessLevel): boolean {
  return (
    level === "admin" || level === "sebavio_plus" || level === "pass_30_jours"
  );
}
