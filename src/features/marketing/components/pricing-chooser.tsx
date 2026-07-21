import { Compass, Map, Orbit } from "lucide-react";
import { FadeIn } from "@/components/common";
import { PRICING_PAGE } from "../lib/pricing-content";
import { MarketingCtaButton } from "./marketing-cta-button";

const ICONS = {
  discover: Compass,
  trip: Map,
  year: Orbit,
} as const;

export function PricingChooser() {
  const { chooser } = PRICING_PAGE;

  return (
    <section
      className="bg-white py-12 sm:py-16"
      aria-labelledby="pricing-chooser-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-chooser-heading"
            className="font-heading text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2.1rem]"
          >
            {chooser.title}
          </h2>
        </FadeIn>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {chooser.scenarios.map((scenario, index) => {
            const Icon = ICONS[scenario.id as keyof typeof ICONS] ?? Compass;
            return (
              <FadeIn key={scenario.id} delay={0.03 * index}>
                <article className="flex h-full flex-col rounded-2xl border border-[#dfe7ef] bg-[#f7f9fc]/70 p-5 transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_12px_32px_rgba(8,43,70,0.08)]">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(139,92,246,0.16))] text-[#3b82f6]">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-heading mt-3 text-lg font-semibold text-[#082b46]">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#60758a]">
                    {scenario.body}
                  </p>
                  <MarketingCtaButton
                    href={scenario.href}
                    variant="soft"
                    size="sm"
                    className="mt-4 w-full"
                  >
                    {scenario.cta}
                  </MarketingCtaButton>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
