import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import { MarketingCtaButton } from "./marketing-cta-button";

export function FinalCta() {
  const { finalCta } = LANDING;

  return (
    <section className="relative overflow-hidden bg-[#050b1c] py-12 text-white sm:py-14 lg:py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.28),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.22),_transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-[clamp(1.5rem,4vw,4.5rem)] text-center">
        <FadeIn>
          <h2 className="font-heading text-[1.75rem] font-bold tracking-tight sm:text-[2.25rem]">
            {finalCta.title}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-white/75">
            {finalCta.body}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingCtaButton href="/register" size="lg">
              {finalCta.primary}
            </MarketingCtaButton>
            <MarketingCtaButton
              href="/fonctionnalites"
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
