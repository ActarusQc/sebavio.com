import type { Metadata } from "next";
import {
  PricingAgentSection,
  PricingChooser,
  PricingComparison,
  PricingFaq,
  PricingFinalCta,
  PricingHero,
  PricingTrust,
  SiteFooter,
  SiteHeader,
} from "@/features/marketing";
import { PricingPlansGrid } from "@/features/subscriptions/components/pricing-plans-grid";
import { listPublicOfficialPlans } from "@/features/subscriptions/services/public-plans";
import {
  OFFICIAL_PLAN_SLUGS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";
import {
  buildComparisonGroups,
  hasVoiceCapability,
} from "@/features/marketing/lib/pricing-presentation";
import { PRICING_PAGE } from "@/features/marketing/lib/pricing-content";
import { BRAND_ASSETS } from "@/features/marketing/lib/brand-assets";
import { auth } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: PRICING_PAGE.meta.title,
  description: PRICING_PAGE.meta.description,
  alternates: {
    canonical: `${SITE_URL}/pricing`,
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: `${SITE_URL}/pricing`,
    siteName: "Sebavia",
    title: PRICING_PAGE.meta.title,
    description: PRICING_PAGE.meta.description,
    images: [
      {
        url: BRAND_ASSETS.heroNightRoad,
        width: 1200,
        height: 630,
        alt: "Tarifs Sebavia — forfaits pour planifier vos voyages",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PRICING_PAGE.meta.title,
    description: PRICING_PAGE.meta.description,
    images: [BRAND_ASSETS.heroNightRoad],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function PricingJsonLd({
  plans,
}: {
  plans: Array<{
    publicName: string;
    shortDescription: string | null;
    unitAmountCents: number | null;
    currency: string;
    slug: string;
  }>;
}) {
  const offers = plans.map((plan) => {
    const amount =
      plan.unitAmountCents ??
      (plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS
        ? PASS_PRICE_CENTS
        : plan.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS
          ? PLUS_PRICE_CENTS
          : 0);
    return {
      "@type": "Offer",
      name: plan.publicName,
      description: plan.shortDescription ?? undefined,
      price: (amount / 100).toFixed(2),
      priceCurrency: (plan.currency || "cad").toUpperCase(),
      url: `${SITE_URL}/pricing#forfait-${plan.slug}`,
    };
  });

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Sebavia",
    description: PRICING_PAGE.meta.description,
    brand: {
      "@type": "Brand",
      name: "Sebavia",
    },
    offers,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function PricingPage() {
  const [session, plans] = await Promise.all([
    auth(),
    listPublicOfficialPlans().catch(() => []),
  ]);

  const cards = plans.map((plan) => {
    const price = plan.currentPrices[0] ?? null;
    return {
      slug: plan.internalName,
      publicName: plan.publicName,
      shortDescription: plan.shortDescription,
      unitAmountCents: price?.unitAmount ?? null,
      currency: price?.currency ?? "cad",
      entitlements: plan.entitlements,
      billingType: price?.billingType ?? null,
      accessDurationDays: price?.accessDurationDays ?? null,
    };
  });

  const comparisonPlans =
    cards.length > 0
      ? cards.map((plan) => ({
          slug: plan.slug,
          entitlements: plan.entitlements ?? [],
          billing: {
            slug: plan.slug,
            billingType: plan.billingType ?? null,
            accessDurationDays: plan.accessDurationDays ?? null,
            interval: null,
          },
        }))
      : [
          {
            slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
            entitlements: [
              {
                key: "trip.preview.enabled",
                enabled: true,
                limit: null,
                value: null,
              },
              { key: "vehicles.max", enabled: true, limit: 1, value: null },
              {
                key: "ai.voice.enabled",
                enabled: false,
                limit: null,
                value: null,
              },
            ],
            billing: {
              slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
              billingType: null,
              accessDurationDays: null,
              interval: null,
            },
          },
          {
            slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
            entitlements: [
              {
                key: "trip.full_access.enabled",
                enabled: true,
                limit: null,
                value: null,
              },
              {
                key: "ai.planning.enabled",
                enabled: true,
                limit: null,
                value: null,
              },
              {
                key: "ai.voice.enabled",
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
              { key: "trips.max", enabled: true, limit: null, value: null },
            ],
            billing: {
              slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
              billingType: "one_time",
              accessDurationDays: 30,
              interval: "one_time",
            },
          },
          {
            slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
            entitlements: [
              {
                key: "trip.full_access.enabled",
                enabled: true,
                limit: null,
                value: null,
              },
              {
                key: "ai.planning.enabled",
                enabled: true,
                limit: null,
                value: null,
              },
              {
                key: "ai.voice.enabled",
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
              { key: "trips.max", enabled: true, limit: null, value: null },
              {
                key: "notifications.enabled",
                enabled: true,
                limit: null,
                value: null,
              },
            ],
            billing: {
              slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
              billingType: "recurring",
              accessDurationDays: null,
              interval: "year",
            },
          },
        ];

  const comparisonGroups = buildComparisonGroups(comparisonPlans);
  const planNames = Object.fromEntries(
    cards.map((p) => [p.slug, p.publicName]),
  );
  if (!planNames[OFFICIAL_PLAN_SLUGS.DECOUVERTE]) {
    planNames[OFFICIAL_PLAN_SLUGS.DECOUVERTE] = "Découverte";
  }
  if (!planNames[OFFICIAL_PLAN_SLUGS.PASS_30_JOURS]) {
    planNames[OFFICIAL_PLAN_SLUGS.PASS_30_JOURS] = "Pass 30 jours";
  }
  if (!planNames[OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS]) {
    planNames[OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS] = "Sebavia Plus";
  }

  const paidEntitlements =
    cards.find((p) => p.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS)
      ?.entitlements ??
    cards.find((p) => p.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS)
      ?.entitlements ??
    comparisonPlans.find((p) => p.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS)
      ?.entitlements ??
    [];
  const voiceIncluded = hasVoiceCapability(paidEntitlements);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f7f9fc]">
      <PricingJsonLd
        plans={
          cards.length > 0
            ? cards
            : comparisonPlans.map((p) => ({
                publicName: planNames[p.slug] ?? p.slug,
                shortDescription: null,
                unitAmountCents:
                  p.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS
                    ? PASS_PRICE_CENTS
                    : p.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS
                      ? PLUS_PRICE_CENTS
                      : 0,
                currency: "cad",
                slug: p.slug,
              }))
        }
      />
      <SiteHeader variant="dark" />
      <main className="flex-1">
        <PricingHero />

        <section
          className="relative -mt-2 bg-[#f7f9fc] px-4 pb-12 sm:px-6 sm:pb-16 lg:px-10"
          aria-labelledby="pricing-plans-heading"
        >
          <h2 id="pricing-plans-heading" className="sr-only">
            Forfaits Sebavia
          </h2>
          <PricingPlansGrid
            plans={cards}
            isAuthenticated={Boolean(session?.user?.id)}
          />
          <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-[#60758a]">
            {PRICING_PAGE.trust.activationNote}
          </p>
        </section>

        <PricingAgentSection voiceIncluded={voiceIncluded} />
        <PricingComparison groups={comparisonGroups} planNames={planNames} />
        <PricingChooser />
        <PricingTrust />
        <PricingFaq />
        <PricingFinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
