import Image from "next/image";
import { FadeIn } from "@/components/common";
import type { PricingCardPlan } from "@/features/subscriptions/components/pricing-plans-grid";
import { LANDING } from "../lib/landing-content";
import { MARKETING_ASSETS } from "../lib/marketing-assets";
import { PricingPreview } from "./pricing-preview";
import { cn } from "@/lib/utils";

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
      className="scroll-mt-24 bg-[#f7f9fc] py-[3.5rem] sm:py-16 lg:py-[4.5rem]"
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
                  <h3 className="font-heading text-[1.1rem] font-semibold text-[#082b46]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 mb-4 text-[0.95rem] leading-relaxed text-[#60758a]">
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
    const vehicle = MARKETING_ASSETS.vehicleSuv;
    return (
      <div className="overflow-hidden rounded-xl border border-[#dfe7ef] bg-white shadow-[0_8px_22px_rgba(8,43,70,0.06)]">
        <div className="flex h-[5.75rem] items-end justify-center bg-gradient-to-b from-[#eef3f8] to-white px-3 pt-2">
          <Image
            src={vehicle.src}
            alt="Véhicule ajouté pour personnaliser la planification du voyage"
            width={vehicle.width}
            height={vehicle.height}
            sizes="(max-width: 768px) 50vw, 180px"
            className="h-[4.75rem] w-auto max-w-full object-contain"
          />
        </div>
        <div className="space-y-1.5 p-3.5 text-[0.75rem]">
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
      <div className="space-y-2 rounded-xl border border-[#dfe7ef] bg-white p-3.5 shadow-[0_8px_22px_rgba(8,43,70,0.06)]">
        <div className="rounded-xl rounded-tr-md bg-[#0c1e38] px-3 py-2.5 text-[0.78rem] leading-snug text-white">
          Nous voulons aller à Percé, avec des arrêts nature et des pauses
          familiales.
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#f7f9fc] px-3 py-2 text-[0.75rem] text-[#60758a]">
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
    <div className="overflow-hidden rounded-xl border border-[#dfe7ef] bg-white shadow-[0_8px_22px_rgba(8,43,70,0.06)]">
      <svg
        viewBox="0 0 220 100"
        className="h-[5.5rem] w-full bg-[#e8f0f8]"
        aria-hidden
      >
        <path
          d="M15 75 C50 65 80 45 110 40 C145 33 175 35 205 27"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="15" cy="75" r="5" fill="#2dd4bf" />
        <circle cx="110" cy="40" r="5" fill="#8b5cf6" />
        <circle cx="205" cy="27" r="5" fill="#fb923c" />
      </svg>
      <div className="space-y-1 p-3.5 text-[0.75rem]">
        <p className="font-semibold text-[#082b46]">Montréal → Percé</p>
        <p className="text-[#60758a]">7 h 24 · 742 km · 5 étapes</p>
      </div>
    </div>
  );
}
