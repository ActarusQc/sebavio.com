import Image from "next/image";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { PRICING_PAGE } from "../lib/pricing-content";
import { MarketingCtaButton } from "./marketing-cta-button";

export function PricingFinalCta() {
  const { finalCta } = PRICING_PAGE;

  return (
    <section className="relative overflow-hidden bg-[#050b1c] py-14 text-white sm:py-16">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={BRAND_ASSETS.heroCampingcar}
          alt=""
          fill
          className="object-cover object-[center_60%] opacity-35"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.28),_transparent_50%),linear-gradient(180deg,rgba(5,11,28,0.75),rgba(5,11,28,0.92))]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <FadeIn>
          <Image
            src={BRAND_ASSETS.sparkle}
            alt=""
            width={28}
            height={28}
            className="mx-auto size-7 motion-safe:animate-pulse"
            aria-hidden
          />
          <h2 className="font-heading mt-3 text-[1.75rem] font-bold tracking-tight sm:text-[2.25rem]">
            {finalCta.title}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-white/75">
            {finalCta.body}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingCtaButton href="/register" size="lg">
              {finalCta.primary}
            </MarketingCtaButton>
            <MarketingCtaButton href="#forfaits" size="lg" variant="secondary">
              {finalCta.secondary}
            </MarketingCtaButton>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
