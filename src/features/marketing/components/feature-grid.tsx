import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import { cn } from "@/lib/utils";
import {
  MarketingConversationMini,
  MarketingFuelPlanMini,
  MarketingRouteAdaptMini,
  MarketingVehicleMini,
} from "./marketing-feature-minis";
import { MarketingCtaButton } from "./marketing-cta-button";

export function FeatureGrid() {
  const { features } = LANDING;

  return (
    <section
      id="fonctionnalites"
      className="scroll-mt-24 bg-white py-[3.5rem] sm:py-16 lg:py-[4.5rem]"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-[96rem] px-[clamp(1.5rem,4vw,4.5rem)] xl:max-w-[98rem]">
        <FadeIn>
          <h2
            id="features-heading"
            className="font-heading mx-auto max-w-3xl text-center text-[1.75rem] font-bold tracking-tight text-[#082b46] sm:text-[2.25rem] lg:text-[2.5rem]"
          >
            {features.title}
          </h2>
        </FadeIn>

        <div className="mx-auto mt-12 grid max-w-[96rem] gap-8 sm:grid-cols-2 sm:gap-7 xl:max-w-[96rem] xl:grid-cols-4 xl:gap-0">
          {features.items.map((item, index) => (
            <FadeIn key={item.id} delay={0.03 * index}>
              <article
                className={cn(
                  "flex h-full flex-col xl:px-5 2xl:px-6",
                  index > 0 && "xl:border-l xl:border-[#dfe7ef]",
                )}
              >
                <div className="mb-5 min-h-[15.5rem] sm:min-h-[16.5rem]">
                  {item.id === "chat" ? <MarketingConversationMini /> : null}
                  {item.id === "fuel" ? <MarketingFuelPlanMini /> : null}
                  {item.id === "adapt" ? <MarketingRouteAdaptMini /> : null}
                  {item.id === "vehicle" ? <MarketingVehicleMini /> : null}
                </div>
                <h3 className="font-heading text-[1.25rem] leading-snug font-semibold text-[#082b46] sm:text-[1.4rem]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[1rem] leading-relaxed text-[#60758a]">
                  {item.body}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <MarketingCtaButton href="/fonctionnalites" variant="soft">
            Voir toutes les fonctionnalités
          </MarketingCtaButton>
        </div>
      </div>
    </section>
  );
}
