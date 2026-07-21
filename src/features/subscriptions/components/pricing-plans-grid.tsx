"use client";

import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { CheckoutButton } from "@/features/subscriptions/components/checkout-button";
import {
  formatCadCents,
  formatPassPrice,
  formatPlusPrice,
} from "@/features/subscriptions/lib/format-price";
import {
  OFFICIAL_PLAN_SLUGS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";
import { cn } from "@/lib/utils";

export type PricingCardPlan = {
  slug: string;
  publicName: string;
  shortDescription: string | null;
  unitAmountCents: number | null;
  currency: string;
};

type PricingPlansGridProps = {
  plans: PricingCardPlan[];
  isAuthenticated: boolean;
};

const FALLBACK_PLANS: PricingCardPlan[] = [
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
    const fallback = FALLBACK_PLANS.find((p) => p.slug === slug)!;
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

export function PricingPlansGrid({
  plans,
  isAuthenticated,
}: PricingPlansGridProps) {
  const ordered = resolvePlans(plans);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
      {ordered.map((plan) => {
        const isDiscovery = plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE;
        const isPass = plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS;
        const isPlus = plan.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS;

        return (
          <article
            key={plan.slug}
            className={cn(
              "border-sebavio-sand/50 bg-sebavio-surface relative flex flex-col rounded-2xl border p-6 shadow-sm",
              isPass && "border-sebavio-gold/50 ring-sebavio-gold/20 ring-2",
              isPlus && "border-sebavio-teal/40",
            )}
          >
            {isPass ? (
              <Badge className="bg-sebavio-gold text-sebavio-navy absolute -top-2.5 left-6">
                Sans abonnement
              </Badge>
            ) : null}
            {isPlus ? (
              <Badge
                variant="secondary"
                className="bg-sebavio-teal-soft text-sebavio-navy absolute -top-2.5 left-6"
              >
                Meilleure valeur
              </Badge>
            ) : null}

            <h2 className="font-heading text-sebavio-navy mt-2 text-xl font-bold">
              {plan.publicName}
            </h2>
            <p className="text-sebavio-muted mt-2 min-h-[3rem] text-sm leading-relaxed">
              {plan.shortDescription}
            </p>

            <p className="text-sebavio-navy font-heading mt-6 text-3xl font-bold tracking-tight">
              {isDiscovery
                ? "0 $"
                : isPass
                  ? formatPassPrice(plan.unitAmountCents ?? PASS_PRICE_CENTS)
                  : formatPlusPrice(plan.unitAmountCents ?? PLUS_PRICE_CENTS)}
            </p>
            {isPass ? (
              <p className="text-sebavio-muted mt-1 text-xs">
                Paiement unique · 30 jours d’accès
              </p>
            ) : null}
            {isPlus ? (
              <p className="text-sebavio-muted mt-1 text-xs">
                Facturation annuelle
              </p>
            ) : null}
            {isDiscovery ? (
              <p className="text-sebavio-muted mt-1 text-xs">
                Gratuit pour toujours
              </p>
            ) : null}

            <div className="mt-8 flex flex-1 flex-col justify-end">
              {isDiscovery ? (
                <Button className="w-full" render={<Link href="/register" />}>
                  Commencer gratuitement
                </Button>
              ) : null}

              {isPass ? (
                isAuthenticated ? (
                  <CheckoutButton
                    kind="pass"
                    label="Accéder à Sebavio pendant 30 jours"
                    returnPath="/pricing"
                    className="w-full"
                  />
                ) : (
                  <Button
                    className="w-full"
                    render={<Link href="/login?callbackUrl=/pricing" />}
                  >
                    Accéder à Sebavio pendant 30 jours
                  </Button>
                )
              ) : null}

              {isPlus ? (
                isAuthenticated ? (
                  <CheckoutButton
                    kind="plus"
                    label="Choisir Sebavio Plus"
                    returnPath="/pricing"
                    className="w-full"
                    variant="outline"
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    render={<Link href="/login?callbackUrl=/pricing" />}
                  >
                    Choisir Sebavio Plus
                  </Button>
                )
              ) : null}
            </div>

            {!isDiscovery && plan.unitAmountCents != null ? (
              <p className="text-sebavio-muted mt-3 text-center text-[0.7rem]">
                {formatCadCents(plan.unitAmountCents)} CAD
                {isPass ? " · sans frais mensuels" : ""}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
