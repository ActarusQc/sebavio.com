import Link from "next/link";
import { MarketingCtaButton } from "./marketing-cta-button";
import { FEATURES_PAGE } from "../lib/features-page-content";

export function FeaturesPlansTeaser() {
  const { plans } = FEATURES_PAGE;

  return (
    <section
      id="forfaits"
      aria-labelledby="features-plans-title"
      className="scroll-mt-28 border-b border-[#e6eef5] bg-[#050b1c] py-12 text-white sm:py-14"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="features-plans-title"
          className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {plans.title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/70">
          {plans.lead}
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.items.map((plan) => (
            <li
              key={plan.name}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
            >
              <h3 className="font-heading text-lg font-semibold">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {plan.body}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <MarketingCtaButton href={plans.cta.href}>
            {plans.cta.label}
          </MarketingCtaButton>
          <p className="mt-3 text-sm text-white/55">
            Les montants et inclusions détaillés sont sur{" "}
            <Link href="/pricing" className="text-sky-300 hover:underline">
              la page Tarifs
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
