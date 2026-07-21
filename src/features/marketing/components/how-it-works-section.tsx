import { Car, Map, MessageSquare } from "lucide-react";
import { FadeIn } from "@/components/common";
import type { PricingCardPlan } from "@/features/subscriptions/components/pricing-plans-grid";
import { LANDING } from "../lib/landing-content";
import { PricingPreview } from "./pricing-preview";

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
      className="scroll-mt-24 bg-[#f7f9fc] py-16 lg:py-[5rem]"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-10">
        <div className="grid items-start gap-8 lg:grid-cols-[1.7fr_1fr] lg:gap-10">
          <div>
            <FadeIn>
              <h2
                id="how-heading"
                className="font-heading text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2rem]"
              >
                {howItWorks.title}
              </h2>
            </FadeIn>

            <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
              {howItWorks.steps.map((step, index) => (
                <FadeIn key={step.n} delay={0.03 * index}>
                  <li className="flex h-full flex-col rounded-2xl border border-[#dfe7ef] bg-white p-4 shadow-sm">
                    <span
                      className="font-heading mb-3 inline-flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-sm font-bold text-white"
                      aria-hidden
                    >
                      {step.n}
                    </span>
                    <h3 className="font-heading text-[0.98rem] font-semibold text-[#082b46]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-[0.8125rem] leading-relaxed text-[#60758a]">
                      {step.body}
                    </p>
                    <div className="mt-3">
                      <StepVisual n={step.n} />
                    </div>
                  </li>
                </FadeIn>
              ))}
            </ol>
          </div>

          <FadeIn delay={0.06}>
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
      <div className="flex items-center gap-2 rounded-xl bg-[#f7f9fc] px-2.5 py-2 text-[0.7rem]">
        <Car className="size-4 text-[#2dd4bf]" aria-hidden />
        <span className="font-medium text-[#082b46]">
          Véhicule · conso. ajustable
        </span>
      </div>
    );
  }
  if (n === 2) {
    return (
      <div className="flex items-start gap-2 rounded-xl rounded-tl-sm bg-[#0c1e38] px-2.5 py-2 text-[0.7rem] text-white">
        <MessageSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>« Direction Percé, pauses familiales. »</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#f7f9fc] px-2.5 py-2 text-[0.7rem]">
      <Map className="size-4 text-[#3b82f6]" aria-hidden />
      <span className="font-medium text-[#082b46]">
        Montréal → Percé · prêt
      </span>
    </div>
  );
}
