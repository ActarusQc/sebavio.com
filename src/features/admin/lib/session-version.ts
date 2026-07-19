/**
 * Logique pure sessionVersion / JWT (révocation immédiate).
 * Le JWT porte une version ; Auth.js la compare à la valeur DB à chaque refresh.
 */

/** Incrément théorique après un bump (miroir de `sessionVersion: { increment: 1 }`). */
export function nextSessionVersion(current: number): number {
  if (!Number.isFinite(current) || current < 0) {
    return 1;
  }
  return Math.floor(current) + 1;
}

/**
 * True si le JWT doit être invalidé (sessions révoquées, MDP changé, etc.).
 * Aligné sur `refreshTokenStatus` dans `src/lib/auth.ts`.
 */
export function isJwtSessionVersionMismatch(
  tokenVersion: number | undefined | null,
  dbVersion: number,
): boolean {
  const token = typeof tokenVersion === "number" ? tokenVersion : 0;
  return token !== dbVersion;
}
