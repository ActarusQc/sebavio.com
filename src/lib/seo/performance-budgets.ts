/** Budgets de performance marketing (lot SEO 5B) — indicatifs, non bloquants mineurs. */
export const PERFORMANCE_BUDGETS = {
  maxTransferKb: 3500,
  maxJsKb: 900,
  maxCssKb: 200,
  maxImageKb: 1500,
  maxLcpMs: 4000,
  maxCls: 0.25,
  maxTbtMs: 600,
  /** Seuls les écarts majeurs / pages inaccessibles / images extrêmes bloquent l’audit. */
  blockingImageKb: 2500,
  blockingCls: 0.4,
  regressionPerfPoints: 0.15,
  regressionLcpMs: 1500,
  regressionCls: 0.1,
} as const;

export const PERFORMANCE_AUDIT_PATHS = [
  "/",
  "/fonctionnalites",
  "/pricing",
  "/assistant-voyage-ia",
  "/planificateur-road-trip-quebec",
  "/guides",
  "/guides/road-trip-nature-quebec",
  "/guides/road-trip-gastronomique-quebec",
  "/register",
] as const;
