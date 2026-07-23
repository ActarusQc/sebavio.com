import { describe, expect, it } from "vitest";

import { PRICING_PAGE } from "@/features/marketing/lib/pricing-content";
import {
  buildComparisonGroups,
  buildPlanHighlights,
  hasVoiceCapability,
} from "@/features/marketing/lib/pricing-presentation";
import { resolvePricingPlans } from "@/features/subscriptions/lib/resolve-pricing-plans";
import {
  formatMonthlyFromAnnual,
  formatPassPrice,
  formatPlusPrice,
} from "@/features/subscriptions/lib/format-price";
import {
  OFFICIAL_PLAN_SLUGS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";

const FULL_ENTS = [
  { key: "trip.full_access.enabled", enabled: true, limit: null, value: null },
  { key: "trip.detours.enabled", enabled: true, limit: null, value: null },
  { key: "fuel.optimization.enabled", enabled: true, limit: null, value: null },
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
  { key: "trip.travel_mode.enabled", enabled: true, limit: null, value: null },
  { key: "trip.gps_tracking.enabled", enabled: true, limit: null, value: null },
  { key: "trips.max", enabled: true, limit: null, value: null },
  { key: "notifications.enabled", enabled: true, limit: null, value: null },
];

const DISCOVERY_ENTS = [
  { key: "trip.preview.enabled", enabled: true, limit: null, value: null },
  { key: "trip.full_access.enabled", enabled: false, limit: null, value: null },
  { key: "vehicles.max", enabled: true, limit: 1, value: null },
  { key: "ai.planning.enabled", enabled: false, limit: null, value: null },
  { key: "ai.voice.enabled", enabled: false, limit: null, value: null },
  { key: "weather.forecast_days", enabled: true, limit: 3, value: null },
  { key: "activities.max", enabled: true, limit: 5, value: null },
];

describe("pricing page — présentation", () => {
  it("affiche les trois forfaits officiels dans l’ordre", () => {
    const plans = resolvePricingPlans([
      {
        slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
        publicName: "Sebavia Plus",
        shortDescription: null,
        unitAmountCents: PLUS_PRICE_CENTS,
        currency: "cad",
        entitlements: FULL_ENTS,
      },
      {
        slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
        publicName: "Découverte",
        shortDescription: null,
        unitAmountCents: 0,
        currency: "cad",
        entitlements: DISCOVERY_ENTS,
      },
      {
        slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
        publicName: "Pass 30 jours",
        shortDescription: null,
        unitAmountCents: PASS_PRICE_CENTS,
        currency: "cad",
        entitlements: FULL_ENTS,
      },
    ]);

    expect(plans).toHaveLength(3);
    expect(plans.map((p) => p.slug)).toEqual([
      OFFICIAL_PLAN_SLUGS.DECOUVERTE,
      OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
      OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
    ]);
  });

  it("utilise les prix provenant des données fournies", () => {
    const plans = resolvePricingPlans([
      {
        slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
        publicName: "Pass 30 jours",
        shortDescription: null,
        unitAmountCents: 1599,
        currency: "cad",
        entitlements: FULL_ENTS,
      },
      {
        slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
        publicName: "Sebavia Plus",
        shortDescription: null,
        unitAmountCents: 7999,
        currency: "cad",
        entitlements: FULL_ENTS,
      },
    ]);

    const pass = plans.find(
      (p) => p.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
    )!;
    const plus = plans.find(
      (p) => p.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
    )!;
    expect(pass.unitAmountCents).toBe(1599);
    expect(plus.unitAmountCents).toBe(7999);
    expect(formatPassPrice(pass.unitAmountCents!)).toContain("15,99");
    expect(formatPlusPrice(plus.unitAmountCents!)).toContain("79,99");
  });

  it("reprend les prix de repli si absents", () => {
    const plans = resolvePricingPlans([]);
    expect(
      plans.find((p) => p.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS)
        ?.unitAmountCents,
    ).toBe(PASS_PRICE_CENTS);
    expect(
      plans.find((p) => p.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS)
        ?.unitAmountCents,
    ).toBe(PLUS_PRICE_CENTS);
    expect(
      plans.find((p) => p.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE)
        ?.unitAmountCents,
    ).toBe(0);
  });

  it("dérive l’équivalent mensuel du prix annuel", () => {
    expect(formatMonthlyFromAnnual(6999)).toBe(
      formatMonthlyFromAnnual(PLUS_PRICE_CENTS),
    );
    // 69,99 $ / 12 → ceil → 5,84 $
    expect(formatMonthlyFromAnnual(6999)).toMatch(/5[,.]84/);
  });

  it("expose les badges et CTA attendus dans le contenu", () => {
    expect(PRICING_PAGE.plans.pass.badge).toBe("Idéal pour un voyage");
    expect(PRICING_PAGE.plans.plus.badge).toBe("Meilleure valeur");
    expect(PRICING_PAGE.plans.decouverte.cta).toBe("Découvrir gratuitement");
    expect(PRICING_PAGE.plans.pass.cta).toBe("Préparer mon prochain voyage");
    expect(PRICING_PAGE.plans.plus.cta).toBe("Choisir Sebavia Plus");
  });

  it("présente Découverte comme aperçu limité", () => {
    const highlights = buildPlanHighlights(
      OFFICIAL_PLAN_SLUGS.DECOUVERTE,
      DISCOVERY_ENTS,
    );
    expect(highlights.some((h) => /interface|profil|véhicule/i.test(h))).toBe(
      true,
    );
    expect(PRICING_PAGE.plans.decouverte.limitNote).toMatch(
      /planification complète/i,
    );
  });

  it("met en avant l’agent et la voix pour les forfaits payants", () => {
    const passHighlights = buildPlanHighlights(
      OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
      FULL_ENTS,
    );
    expect(passHighlights.some((h) => /agent/i.test(h))).toBe(true);
    expect(passHighlights.some((h) => /vocale/i.test(h))).toBe(true);
    expect(hasVoiceCapability(FULL_ENTS)).toBe(true);
    expect(hasVoiceCapability(DISCOVERY_ENTS)).toBe(false);
    expect(PRICING_PAGE.agent.title).toMatch(/planificateur/i);
    expect(PRICING_PAGE.agent.voiceTitle).toMatch(/vocale/i);
  });

  it("construit une comparaison à partir des entitlements", () => {
    const groups = buildComparisonGroups([
      {
        slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
        entitlements: DISCOVERY_ENTS,
        billing: {
          slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
          billingType: null,
          accessDurationDays: null,
          interval: null,
        },
      },
      {
        slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
        entitlements: FULL_ENTS,
        billing: {
          slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
          billingType: "one_time",
          accessDurationDays: 30,
          interval: "one_time",
        },
      },
      {
        slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
        entitlements: FULL_ENTS,
        billing: {
          slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
          billingType: "recurring",
          accessDurationDays: null,
          interval: "year",
        },
      },
    ]);

    expect(groups.length).toBeGreaterThanOrEqual(4);
    const planGroup = groups.find((g) => g.id === "plan")!;
    const fullRoute = planGroup.rows.find((r) => r.id === "full-route")!;
    expect(fullRoute.cells[OFFICIAL_PLAN_SLUGS.DECOUVERTE]?.kind).toBe("no");
    expect(fullRoute.cells[OFFICIAL_PLAN_SLUGS.PASS_30_JOURS]?.kind).toBe(
      "yes",
    );

    const voiceRow = groups
      .find((g) => g.id === "travel")!
      .rows.find((r) => r.id === "voice")!;
    expect(voiceRow.cells[OFFICIAL_PLAN_SLUGS.PASS_30_JOURS]?.kind).toBe("yes");
    expect(voiceRow.cells[OFFICIAL_PLAN_SLUGS.DECOUVERTE]?.kind).toBe("no");

    const duration = groups.find((g) => g.id === "duration")!;
    const days = duration.rows.find((r) => r.id === "days")!;
    expect(days.cells[OFFICIAL_PLAN_SLUGS.PASS_30_JOURS]).toMatchObject({
      kind: "text",
      label: "30 jours",
    });
    const renewal = duration.rows.find((r) => r.id === "renewal")!;
    const passRenewal = renewal.cells[OFFICIAL_PLAN_SLUGS.PASS_30_JOURS];
    expect(passRenewal?.kind).toBe("text");
    if (passRenewal?.kind === "text") {
      expect(passRenewal.label).toMatch(/unique/i);
    }
  });

  it("ne contient aucune mention technique de webhook Stripe", () => {
    const blob = JSON.stringify(PRICING_PAGE);
    expect(blob.toLowerCase()).not.toMatch(/webhook/);
    expect(blob).toMatch(/activé automatiquement/i);
  });

  it("conserve une FAQ et un guide de choix", () => {
    expect(PRICING_PAGE.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(PRICING_PAGE.chooser.scenarios).toHaveLength(3);
    expect(PRICING_PAGE.faq.items.some((i) => /gratuitement/i.test(i.q))).toBe(
      true,
    );
    expect(
      PRICING_PAGE.faq.items.some((i) =>
        /Pass 30 jours.*abonnement/i.test(i.q),
      ),
    ).toBe(true);
  });

  it("marque un forfait manquant comme indisponible si d’autres sont présents", () => {
    const plans = resolvePricingPlans([
      {
        slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
        publicName: "Découverte",
        shortDescription: null,
        unitAmountCents: 0,
        currency: "cad",
      },
    ]);
    const pass = plans.find(
      (p) => p.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
    )!;
    expect(pass.unavailable).toBe(true);
  });
});
