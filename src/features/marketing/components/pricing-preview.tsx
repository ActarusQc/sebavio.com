"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { CheckoutButton } from "@/features/subscriptions/components/checkout-button";
import {
  formatPassPrice,
  formatPlusPrice,
} from "@/features/subscriptions/lib/format-price";
import {
  OFFICIAL_PLAN_SLUGS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";
import type { PricingCardPlan } from "@/features/subscriptions/lib/resolve-pricing-plans";
import { cn } from "@/lib/utils";
import { LANDING } from "../lib/landing-content";
import { MarketingCtaButton } from "./marketing-cta-button";

type PricingPreviewProps = {
  plans: PricingCardPlan[];
  isAuthenticated: boolean;
};

const FALLBACK: PricingCardPlan[] = [
  {
    slug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
    publicName: "Découverte",
    shortDescription: "Aperçu gratuit pour découvrir Sebavio.",
    unitAmountCents: 0,
    currency: "cad",
  },
  {
    slug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
    publicName: "Pass 30 jours",
    shortDescription:
      "Accès complet pendant 30 jours — idéal pour un voyage ou des vacances.",
    unitAmountCents: PASS_PRICE_CENTS,
    currency: "cad",
  },
  {
    slug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
    publicName: "Sebavio Plus",
    shortDescription: "Accès complet toute l’année, facturé annuellement.",
    unitAmountCents: PLUS_PRICE_CENTS,
    currency: "cad",
  },
];

const ORDER = [
  OFFICIAL_PLAN_SLUGS.DECOUVERTE,
  OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
  OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
] as const;

function resolvePlans(plans: PricingCardPlan[]): PricingCardPlan[] {
  const bySlug = new Map(plans.map((p) => [p.slug, p]));
  return ORDER.map((slug) => {
    const found = bySlug.get(slug);
    const fallback = FALLBACK.find((p) => p.slug === slug)!;
    return found
      ? {
          ...fallback,
          ...found,
          unitAmountCents: found.unitAmountCents ?? fallback.unitAmountCents,
          shortDescription: found.shortDescription ?? fallback.shortDescription,
        }
      : fallback;
  });
}

function periodLabel(slug: string): string {
  if (slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) return "Gratuit";
  if (slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS)
    return "Paiement unique · 30 jours";
  return "Facturation annuelle";
}

function priceLabel(plan: PricingCardPlan): string {
  if (plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) return "0 $";
  if (plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
    return formatPassPrice(plan.unitAmountCents ?? PASS_PRICE_CENTS);
  }
  return formatPlusPrice(plan.unitAmountCents ?? PLUS_PRICE_CENTS);
}

const gradientBtn =
  "w-full rounded-xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white hover:brightness-110";

/** Aperçu forfaits — données réelles, présentation maquette. */
export function PricingPreview({
  plans,
  isAuthenticated,
}: PricingPreviewProps) {
  const ordered = resolvePlans(plans);

  return (
    <aside
      id="tarifs-apercu"
      className="rounded-2xl border border-[#dfe7ef] bg-white p-5 shadow-[0_12px_40px_rgba(8,43,70,0.08)] sm:p-5"
      aria-labelledby="pricing-preview-heading"
    >
      <h2
        id="pricing-preview-heading"
        className="font-heading text-lg font-bold text-[#082b46]"
      >
        {LANDING.pricing.title}
      </h2>

      <ul className="mt-4 space-y-2.5">
        {ordered.map((plan) => {
          const isPass = plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS;
          const isDiscovery = plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE;
          const isPlus = plan.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS;

          return (
            <li
              key={plan.slug}
              className={cn(
                "relative rounded-xl border px-3.5 py-3",
                isPass
                  ? "from-[#3b82f6]/08 border-[#8b5cf6]/35 bg-gradient-to-br to-[#8b5cf6]/12"
                  : "border-[#dfe7ef] bg-[#f7f9fc]/60",
              )}
            >
              {isPass ? (
                <Badge className="absolute -top-2.5 right-3 border-0 bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white">
                  Sans abonnement
                </Badge>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-[#082b46]">
                    {plan.publicName}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[0.7rem] leading-snug text-[#60758a]">
                    {plan.shortDescription}
                  </p>
                  <p className="mt-1 text-[0.62rem] text-[#60758a]">
                    {periodLabel(plan.slug)}
                  </p>
                </div>
                <p className="font-heading shrink-0 text-base font-bold text-[#082b46]">
                  {priceLabel(plan)}
                </p>
              </div>
              <div className="mt-2.5">
                {isDiscovery ? (
                  <MarketingCtaButton
                    href="/register"
                    size="sm"
                    variant="soft"
                    className="w-full"
                  >
                    Commencer gratuitement
                  </MarketingCtaButton>
                ) : null}
                {isPass ? (
                  isAuthenticated ? (
                    <CheckoutButton
                      kind="pass"
                      label="Choisir le Pass 30 jours"
                      returnPath="/"
                      className={gradientBtn}
                      size="sm"
                    />
                  ) : (
                    <MarketingCtaButton
                      href="/login?callbackUrl=/pricing"
                      size="sm"
                      className="w-full"
                    >
                      Choisir le Pass 30 jours
                    </MarketingCtaButton>
                  )
                ) : null}
                {isPlus ? (
                  isAuthenticated ? (
                    <CheckoutButton
                      kind="plus"
                      label="Choisir Sebavio Plus"
                      returnPath="/"
                      className={gradientBtn}
                      size="sm"
                    />
                  ) : (
                    <MarketingCtaButton
                      href="/login?callbackUrl=/pricing"
                      size="sm"
                      className="w-full"
                    >
                      Choisir Sebavio Plus
                    </MarketingCtaButton>
                  )
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#3b82f6] transition-colors hover:text-[#8b5cf6]"
      >
        {LANDING.pricing.seeAll}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </aside>
  );
}
