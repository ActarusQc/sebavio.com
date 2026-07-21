import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import { MarketingCtaButton } from "./marketing-cta-button";

export function FinalCta() {
  const { finalCta } = LANDING;

  return (
    <section className="bg-sebavio-night relative overflow-hidden py-16 text-white sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.25),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.2),_transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {finalCta.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
            {finalCta.body}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingCtaButton href="/register" size="lg">
              {finalCta.primary}
            </MarketingCtaButton>
            <MarketingCtaButton
              href="/#fonctionnalites"
              size="lg"
              variant="secondary"
            >
              {finalCta.secondary}
            </MarketingCtaButton>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
