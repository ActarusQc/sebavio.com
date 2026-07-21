"use client";

import Link from "next/link";
import { CalendarDays, Check, Compass, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { CheckoutButton } from "@/features/subscriptions/components/checkout-button";
import {
  formatCadCents,
  formatMonthlyFromAnnual,
  formatPassPrice,
  formatPlusPrice,
} from "@/features/subscriptions/lib/format-price";
import {
  OFFICIAL_PLAN_SLUGS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";
import {
  resolvePricingPlans,
  type PricingCardPlan,
} from "@/features/subscriptions/lib/resolve-pricing-plans";
import { MarketingCtaButton } from "@/features/marketing/components/marketing-cta-button";
import { PRICING_PAGE } from "@/features/marketing/lib/pricing-content";
import { buildPlanHighlights } from "@/features/marketing/lib/pricing-presentation";
import { cn } from "@/lib/utils";

export type { PricingCardPlan };
export { resolvePricingPlans };

type PricingPlansGridProps = {
  plans: PricingCardPlan[];
  isAuthenticated: boolean;
};

function PlanIcon({ slug }: { slug: string }) {
  if (slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) {
    return <Compass className="size-5" aria-hidden />;
  }
  if (slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
    return <CalendarDays className="size-5" aria-hidden />;
  }
  return <Star className="size-5" aria-hidden />;
}

function priceLabel(plan: PricingCardPlan): string {
  if (plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) return "0 $";
  if (plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
    return formatPassPrice(plan.unitAmountCents ?? PASS_PRICE_CENTS);
  }
  return formatPlusPrice(plan.unitAmountCents ?? PLUS_PRICE_CENTS);
}

function priceNote(plan: PricingCardPlan): string {
  if (plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) {
    return PRICING_PAGE.plans.decouverte.priceNote;
  }
  if (plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
    return PRICING_PAGE.plans.pass.priceNote;
  }
  return PRICING_PAGE.plans.plus.priceNote;
}

function subtitle(plan: PricingCardPlan): string {
  if (plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) {
    return PRICING_PAGE.plans.decouverte.subtitle;
  }
  if (plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
    return PRICING_PAGE.plans.pass.subtitle;
  }
  return PRICING_PAGE.plans.plus.subtitle;
}

const gradientBtn =
  "w-full rounded-xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white shadow-[0_8px_24px_rgba(59,130,246,0.28)] hover:brightness-110";

export function PricingPlansGrid({
  plans,
  isAuthenticated,
}: PricingPlansGridProps) {
  const ordered = resolvePricingPlans(plans);

  return (
    <div
      id="forfaits"
      className="mx-auto grid max-w-6xl scroll-mt-28 gap-5 md:gap-6 lg:grid-cols-3"
    >
      {ordered.map((plan) => {
        const isDiscovery = plan.slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE;
        const isPass = plan.slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS;
        const isPlus = plan.slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS;
        const highlights = buildPlanHighlights(
          plan.slug,
          plan.entitlements ?? [],
        );
        const annualCents = plan.unitAmountCents ?? PLUS_PRICE_CENTS;

        return (
          <article
            key={plan.slug}
            id={`forfait-${plan.slug}`}
            className={cn(
              "relative flex scroll-mt-28 flex-col rounded-[1.35rem] border p-5 transition-[transform,box-shadow,border-color] duration-200 sm:p-6",
              "motion-safe:hover:-translate-y-0.5",
              "focus-within:ring-2 focus-within:ring-[#3b82f6]/45 focus-within:outline-none",
              isDiscovery &&
                "border-[#dfe7ef] bg-white/90 shadow-[0_8px_28px_rgba(8,43,70,0.05)]",
              isPass &&
                "border-[#8b5cf6]/30 bg-gradient-to-b from-[#f7f9fc] to-white shadow-[0_12px_36px_rgba(59,130,246,0.1)]",
              isPlus &&
                "border-[#3b82f6]/45 bg-gradient-to-b from-[#0c1e38] via-[#102744] to-[#0a1830] text-white shadow-[0_18px_48px_rgba(8,43,70,0.28)] ring-1 ring-[#8b5cf6]/25",
              plan.unavailable && "opacity-70",
            )}
          >
            {isPass ? (
              <Badge className="absolute -top-2.5 left-5 border-0 bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white">
                {PRICING_PAGE.plans.pass.badge}
              </Badge>
            ) : null}
            {isPlus ? (
              <Badge className="absolute -top-2.5 left-5 border-0 bg-[#f0b64d] text-[#0e2d46]">
                <Sparkles className="mr-1 size-3.5" aria-hidden />
                {PRICING_PAGE.plans.plus.badge}
              </Badge>
            ) : null}

            <div className="mt-1 flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                  isPlus
                    ? "bg-[linear-gradient(135deg,rgba(59,130,246,0.45),rgba(139,92,246,0.45))] text-[#c4b5fd]"
                    : "bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.14))] text-[#3b82f6]",
                )}
              >
                <PlanIcon slug={plan.slug} />
              </span>
              <div className="min-w-0">
                <h2
                  className={cn(
                    "font-heading text-xl font-bold tracking-tight",
                    isPlus ? "text-white" : "text-[#082b46]",
                  )}
                >
                  {plan.publicName}
                </h2>
                <p
                  className={cn(
                    "mt-1 text-sm leading-relaxed",
                    isPlus ? "text-white/70" : "text-[#60758a]",
                  )}
                >
                  {subtitle(plan)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p
                className={cn(
                  "font-heading text-3xl font-bold tracking-tight",
                  isPlus ? "text-white" : "text-[#082b46]",
                )}
              >
                <span className="sr-only">Prix : </span>
                {priceLabel(plan)}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  isPlus ? "text-white/55" : "text-[#60758a]",
                )}
              >
                {priceNote(plan)}
              </p>
              {isPlus ? (
                <p className="mt-1 text-xs text-white/50">
                  Moins de {formatMonthlyFromAnnual(annualCents)} par mois
                </p>
              ) : null}
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {highlights.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-snug">
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      isPlus ? "text-[#2dd4bf]" : "text-[#3b82f6]",
                    )}
                    aria-hidden
                  />
                  <span
                    className={isPlus ? "text-white/85" : "text-[#082b46]/90"}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {isDiscovery ? (
              <p className="mt-4 rounded-xl bg-[#fff3e8] px-3 py-2.5 text-xs leading-relaxed text-[#8a4b1a]">
                {PRICING_PAGE.plans.decouverte.limitNote}
              </p>
            ) : null}
            {isPass ? (
              <p className="mt-4 text-xs text-[#60758a]">
                {PRICING_PAGE.plans.pass.renewNote}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              {plan.unavailable ? (
                <p
                  className={cn(
                    "rounded-xl px-3 py-2 text-center text-xs",
                    isPlus
                      ? "bg-white/10 text-white/70"
                      : "bg-[#f7f9fc] text-[#60758a]",
                  )}
                  role="status"
                >
                  Forfait temporairement indisponible
                </p>
              ) : null}

              {isDiscovery && !plan.unavailable ? (
                <MarketingCtaButton
                  href="/register"
                  className="w-full"
                  variant="soft"
                >
                  {PRICING_PAGE.plans.decouverte.cta}
                </MarketingCtaButton>
              ) : null}

              {isPass && !plan.unavailable ? (
                isAuthenticated ? (
                  <CheckoutButton
                    kind="pass"
                    label={PRICING_PAGE.plans.pass.cta}
                    returnPath="/pricing"
                    className={gradientBtn}
                  />
                ) : (
                  <MarketingCtaButton
                    href="/login?callbackUrl=/pricing"
                    className="w-full"
                  >
                    {PRICING_PAGE.plans.pass.cta}
                  </MarketingCtaButton>
                )
              ) : null}

              {isPlus && !plan.unavailable ? (
                isAuthenticated ? (
                  <CheckoutButton
                    kind="plus"
                    label={PRICING_PAGE.plans.plus.cta}
                    returnPath="/pricing"
                    className={cn(gradientBtn, "ring-1 ring-white/20")}
                  />
                ) : (
                  <MarketingCtaButton
                    href="/login?callbackUrl=/pricing"
                    className="w-full"
                  >
                    {PRICING_PAGE.plans.plus.cta}
                  </MarketingCtaButton>
                )
              ) : null}

              <Link
                href="#comparaison"
                className={cn(
                  "text-center text-sm font-medium underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-[#3b82f6]/45 focus-visible:outline-none",
                  isPlus ? "text-white/70 hover:text-white" : "text-[#3b82f6]",
                )}
              >
                {isDiscovery
                  ? PRICING_PAGE.plans.decouverte.detailsLabel
                  : isPass
                    ? PRICING_PAGE.plans.pass.detailsLabel
                    : PRICING_PAGE.plans.plus.detailsLabel}
              </Link>
            </div>

            {!isDiscovery && plan.unitAmountCents != null ? (
              <p
                className={cn(
                  "mt-3 text-center text-[0.7rem]",
                  isPlus ? "text-white/40" : "text-[#60758a]",
                )}
              >
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
