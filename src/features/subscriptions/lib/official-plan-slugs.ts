export const OFFICIAL_PLAN_SLUGS = {
  DECOUVERTE: "decouverte",
  PASS_30_JOURS: "pass-30-jours",
  SEBAVIO_PLUS: "sebavio-plus",
} as const;

export const PASS_DURATION_DAYS = 30;
export const PASS_PRICE_CENTS = 1299;
export const PLUS_PRICE_CENTS = 6999;
export const OFFICIAL_CURRENCY = "cad";

export type OfficialPlanSlug =
  (typeof OFFICIAL_PLAN_SLUGS)[keyof typeof OFFICIAL_PLAN_SLUGS];
