"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Button } from "@/components/ui";
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
import type { PricingCardPlan } from "@/features/subscriptions/components/pricing-plans-grid";
import { cn } from "@/lib/utils";
import { LANDING } from "../lib/landing-content";

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

/** Aperçu forfaits — mêmes données que /pricing. */
export function PricingPreview({
  plans,
  isAuthenticated,
}: PricingPreviewProps) {
  const ordered = resolvePlans(plans);

  return (
    <aside
      id="tarifs-apercu"
      className="border-sebavio-sand/50 rounded-2xl border bg-white p-5 shadow-md sm:p-6"
      aria-labelledby="pricing-preview-heading"
    >
      <h2
        id="pricing-preview-heading"
        className="font-heading text-sebavio-navy text-xl font-bold"
      >
        {LANDING.pricing.title}
      </h2>

      <ul className="mt-5 space-y-3">
        {ordered.map((plan) => {
          const isPass = plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS;
          const isDiscovery = plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE;
          const isPlus = plan.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS;

          return (
            <li
              key={plan.slug}
              className={cn(
                "relative rounded-xl border p-4",
                isPass
                  ? "from-[#3b82f6]/08 border-[#8b5cf6]/35 bg-gradient-to-br to-[#8b5cf6]/10 ring-1 ring-[#8b5cf6]/20"
                  : "border-sebavio-sand/40 bg-sebavio-surface/40",
              )}
            >
              {isPass ? (
                <Badge className="bg-sebavio-gold text-sebavio-navy absolute -top-2.5 right-3">
                  Sans abonnement
                </Badge>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-sebavio-navy font-semibold">
                    {plan.publicName}
                  </p>
                  <p className="text-sebavio-muted mt-1 text-xs leading-relaxed">
                    {plan.shortDescription}
                  </p>
                  <p className="text-sebavio-muted mt-2 text-[0.65rem]">
                    {periodLabel(plan.slug)}
                  </p>
                </div>
                <p className="font-heading text-sebavio-navy shrink-0 text-lg font-bold">
                  {priceLabel(plan)}
                </p>
              </div>
              <div className="mt-3">
                {isDiscovery ? (
                  <Button
                    size="sm"
                    className="w-full"
                    render={<Link href="/register" />}
                  >
                    Commencer gratuitement
                  </Button>
                ) : null}
                {isPass ? (
                  isAuthenticated ? (
                    <CheckoutButton
                      kind="pass"
                      label="Choisir le Pass 30 jours"
                      returnPath="/"
                      className="w-full"
                      size="sm"
                    />
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      render={<Link href="/login?callbackUrl=/pricing" />}
                    >
                      Choisir le Pass 30 jours
                    </Button>
                  )
                ) : null}
                {isPlus ? (
                  isAuthenticated ? (
                    <CheckoutButton
                      kind="plus"
                      label="Choisir Sebavio Plus"
                      returnPath="/"
                      className="w-full"
                      size="sm"
                      variant="outline"
                    />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      render={<Link href="/login?callbackUrl=/pricing" />}
                    >
                      Choisir Sebavio Plus
                    </Button>
                  )
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        href="/pricing"
        className="text-sebavio-slate hover:text-sebavio-navy mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
      >
        {LANDING.pricing.seeAll}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </aside>
  );
}
