import { PRICING_PAGE } from "@/features/marketing/lib/pricing-content";
import type { PlanEntitlementSnapshot } from "@/features/marketing/lib/pricing-presentation";
import {
  OFFICIAL_PLAN_SLUGS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";

export type PricingCardPlan = {
  slug: string;
  publicName: string;
  shortDescription: string | null;
  unitAmountCents: number | null;
  currency: string;
  entitlements?: PlanEntitlementSnapshot[];
  billingType?: string | null;
  accessDurationDays?: number | null;
  unavailable?: boolean;
};

const FALLBACK_PLANS: PricingCardPlan[] = [
  {
    slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
    publicName: "Découverte",
    shortDescription: PRICING_PAGE.plans.decouverte.subtitle,
    unitAmountCents: 0,
    currency: "cad",
    entitlements: [
      {
        key: "trip.preview.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "vehicles.max", enabled: true, limit: 1, value: null },
      {
        key: "trip.full_access.enabled",
        enabled: false,
        limit: null,
        value: null,
      },
      { key: "ai.planning.enabled", enabled: false, limit: null, value: null },
      { key: "ai.voice.enabled", enabled: false, limit: null, value: null },
    ],
  },
  {
    slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
    publicName: "Pass 30 jours",
    shortDescription: PRICING_PAGE.plans.pass.subtitle,
    unitAmountCents: PASS_PRICE_CENTS,
    currency: "cad",
    billingType: "one_time",
    accessDurationDays: 30,
    entitlements: [
      {
        key: "trip.full_access.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "trip.detours.enabled", enabled: true, limit: null, value: null },
      {
        key: "fuel.optimization.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "weather.forecast_days", enabled: true, limit: 16, value: null },
      {
        key: "ai.recommendations.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "vehicles.max", enabled: true, limit: null, value: null },
      { key: "ai.planning.enabled", enabled: true, limit: null, value: null },
      { key: "ai.voice.enabled", enabled: true, limit: null, value: null },
      {
        key: "trip.travel_mode.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      {
        key: "trip.gps_tracking.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
    ],
  },
  {
    slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
    publicName: "Sebavio Plus",
    shortDescription: PRICING_PAGE.plans.plus.subtitle,
    unitAmountCents: PLUS_PRICE_CENTS,
    currency: "cad",
    billingType: "recurring",
    entitlements: [
      {
        key: "trip.full_access.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "trip.detours.enabled", enabled: true, limit: null, value: null },
      {
        key: "fuel.optimization.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "weather.forecast_days", enabled: true, limit: 16, value: null },
      {
        key: "ai.recommendations.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "vehicles.max", enabled: true, limit: null, value: null },
      { key: "ai.planning.enabled", enabled: true, limit: null, value: null },
      { key: "ai.voice.enabled", enabled: true, limit: null, value: null },
      {
        key: "trip.travel_mode.enabled",
        enabled: true,
        limit: null,
        value: null,
      },
      { key: "trips.max", enabled: true, limit: null, value: null },
      { key: "notifications.enabled", enabled: true, limit: null, value: null },
    ],
  },
];

const ORDER = [
  OFFICIAL_PLAN_SLUGS.DECOUVERTE,
  OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
  OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
] as const;

export function resolvePricingPlans(
  plans: PricingCardPlan[],
): PricingCardPlan[] {
  const bySlug = new Map(plans.map((p) => [p.slug, p]));
  return ORDER.map((slug) => {
    const found = bySlug.get(slug);
    const fallback = FALLBACK_PLANS.find((p) => p.slug === slug)!;
    if (!found) return { ...fallback, unavailable: plans.length > 0 };
    return {
      ...fallback,
      ...found,
      unitAmountCents: found.unitAmountCents ?? fallback.unitAmountCents,
      shortDescription: found.shortDescription ?? fallback.shortDescription,
      entitlements:
        found.entitlements && found.entitlements.length > 0
          ? found.entitlements
          : fallback.entitlements,
      unavailable: found.unavailable,
    };
  });
}
