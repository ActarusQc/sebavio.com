import { FadeIn } from "@/components/common";
import type { PricingCardPlan } from "@/features/subscriptions/components/pricing-plans-grid";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { LANDING } from "../lib/landing-content";
import { PricingPreview } from "./pricing-preview";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
      className="scroll-mt-24 bg-[#f7f9fc] py-[3.5rem] sm:py-16 lg:py-[4.25rem]"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto grid max-w-[96rem] items-start gap-8 px-[clamp(1.5rem,4vw,4.5rem)] lg:grid-cols-[minmax(0,2.1fr)_minmax(21rem,0.9fr)] lg:gap-10">
        <div>
          <FadeIn>
            <p className="text-[0.8rem] font-semibold tracking-wide text-[#3b82f6] uppercase">
              {howItWorks.eyebrow}
            </p>
            <h2
              id="how-heading"
              className="font-heading mt-1 text-[1.75rem] font-bold tracking-tight text-[#082b46] sm:text-[2.15rem]"
            >
              {howItWorks.title}
            </h2>
          </FadeIn>

          <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-0">
            {howItWorks.steps.map((step, index) => (
              <FadeIn key={step.n} delay={0.03 * index}>
                <li
                  className={cn(
                    "flex h-full flex-col sm:px-4",
                    index > 0 && "sm:border-l sm:border-[#dfe7ef]",
                  )}
                >
                  <span
                    className="font-heading mb-3 inline-flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-sm font-bold text-white"
                    aria-hidden
                  >
                    {step.n}
                  </span>
                  <h3 className="font-heading text-[1.05rem] font-semibold text-[#082b46]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 mb-4 text-[0.9rem] leading-relaxed text-[#60758a]">
                    {step.body}
                  </p>
                  <div className="mt-auto">
                    <StepVisual n={step.n} />
                  </div>
                </li>
              </FadeIn>
            ))}
          </ol>
        </div>

        <FadeIn delay={0.05}>
          <PricingPreview plans={plans} isAuthenticated={isAuthenticated} />
        </FadeIn>
      </div>
    </section>
  );
}

function StepVisual({ n }: { n: number }) {
  if (n === 1) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#dfe7ef] bg-white shadow-sm">
        <div className="flex h-16 items-end justify-center bg-gradient-to-b from-[#e8eef5] to-white pt-2">
          <Image
            src={BRAND_ASSETS.icons.campingcar.teal}
            alt=""
            width={40}
            height={40}
            className="mb-1 size-10 object-contain"
          />
        </div>
        <div className="space-y-1.5 p-3 text-[0.7rem]">
          <p className="font-semibold text-[#082b46]">Toyota RAV4 2021</p>
          <div className="flex justify-between text-[#60758a]">
            <span>Consommation</span>
            <span className="font-medium text-[#082b46]">8,4 L/100 km</span>
          </div>
          <div className="flex justify-between text-[#60758a]">
            <span>Réservoir</span>
            <span className="font-medium text-[#082b46]">55 L</span>
          </div>
        </div>
      </div>
    );
  }

  if (n === 2) {
    return (
      <div className="space-y-2 rounded-xl border border-[#dfe7ef] bg-white p-3 shadow-sm">
        <div className="rounded-xl rounded-tr-md bg-[#0c1e38] px-3 py-2.5 text-[0.72rem] leading-snug text-white">
          Nous voulons aller à Percé, avec des arrêts nature et des pauses
          familiales.
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#f7f9fc] px-3 py-2 text-[0.7rem] text-[#60758a]">
          <span className="inline-flex gap-0.5" aria-hidden>
            <span className="size-1.5 animate-pulse rounded-full bg-[#8b5cf6]" />
            <span className="size-1.5 animate-pulse rounded-full bg-[#8b5cf6] [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-[#8b5cf6] [animation-delay:300ms]" />
          </span>
          Sebavio planifie votre voyage…
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#dfe7ef] bg-white shadow-sm">
      <svg viewBox="0 0 220 90" className="h-[4.5rem] w-full bg-[#e8f0f8]">
        <path
          d="M15 70 C50 60 80 40 110 35 C145 28 175 30 205 22"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="15" cy="70" r="5" fill="#2dd4bf" />
        <circle cx="205" cy="22" r="5" fill="#fb923c" />
      </svg>
      <div className="space-y-1 p-3 text-[0.7rem]">
        <p className="font-semibold text-[#082b46]">Montréal → Percé</p>
        <p className="text-[#60758a]">7 h 24 · 742 km · 5 étapes</p>
      </div>
    </div>
  );
}
