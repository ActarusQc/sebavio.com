import { Car, MessageSquare, Map } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import { PricingPreview } from "./pricing-preview";
import type { PricingCardPlan } from "@/features/subscriptions/components/pricing-plans-grid";

type HowItWorksSectionProps = {
  plans: PricingCardPlan[];
  isAuthenticated: boolean;
};

export function HowItWorksSection({
  plans,
  isAuthenticated,
}: HowItWorksSectionProps) {
  const { howItWorks } = LANDING;

  return (
    <section
      id="comment-ca-fonctionne"
      className="bg-sebavio-background scroll-mt-24 py-16 sm:py-20 lg:py-24"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <FadeIn>
              <h2
                id="how-heading"
                className="font-heading text-sebavio-navy text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {howItWorks.title}
              </h2>
            </FadeIn>

            <ol className="mt-8 space-y-5">
              {howItWorks.steps.map((step, index) => (
                <FadeIn key={step.n} delay={0.04 * index}>
                  <li className="border-sebavio-sand/40 flex gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                    <span
                      className="font-heading from-sebavio-gradient-from to-sebavio-gradient-to flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white"
                      aria-hidden
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-sebavio-navy text-base font-semibold sm:text-lg">
                        {step.title}
                      </h3>
                      <p className="text-sebavio-muted mt-1 text-sm leading-relaxed">
                        {step.body}
                      </p>
                      <div className="mt-3">
                        <StepVisual n={step.n} />
                      </div>
                    </div>
                  </li>
                </FadeIn>
              ))}
            </ol>
          </div>

          <FadeIn delay={0.08} className="lg:pt-14">
            <PricingPreview plans={plans} isAuthenticated={isAuthenticated} />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function StepVisual({ n }: { n: number }) {
  if (n === 1) {
    return (
      <div className="bg-sebavio-surface inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
        <Car className="text-sebavio-teal size-4" aria-hidden />
        <span className="text-sebavio-navy font-medium">
          Véhicule · consommation ajustable
        </span>
      </div>
    );
  }
  if (n === 2) {
    return (
      <div className="bg-sebavio-navy/95 inline-flex max-w-sm items-start gap-2 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-white">
        <MessageSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          « Nous partons de Montréal vers Percé, avec des pauses familiales. »
        </span>
      </div>
    );
  }
  return (
    <div className="bg-sebavio-surface inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
      <Map className="text-sebavio-slate size-4" aria-hidden />
      <span className="text-sebavio-navy font-medium">
        Montréal → Percé · itinéraire + arrêts
      </span>
    </div>
  );
}
