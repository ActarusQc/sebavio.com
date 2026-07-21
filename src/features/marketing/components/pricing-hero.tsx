import Image from "next/image";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { PRICING_PAGE } from "../lib/pricing-content";

export function PricingHero() {
  const { hero } = PRICING_PAGE;

  return (
    <section className="relative isolate overflow-hidden bg-[#050b1c] text-white">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <Image
          src={BRAND_ASSETS.heroNightRoad}
          alt=""
          fill
          priority
          className="object-cover object-[center_45%] opacity-90"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 40% 50% at 78% 28%, rgba(240,182,77,0.22), transparent 55%),
              radial-gradient(ellipse 50% 60% at 20% 50%, rgba(59,130,246,0.2), transparent 60%),
              linear-gradient(180deg, rgba(5,11,28,0.55) 0%, rgba(5,11,28,0.35) 40%, rgba(5,11,28,0.78) 100%),
              linear-gradient(90deg, rgba(5,11,28,0.7) 0%, rgba(5,11,28,0.35) 45%, rgba(5,11,28,0.55) 100%)
            `,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[90rem] px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:px-10 lg:pt-14 lg:pb-24">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.08em] text-[#f0b64d] uppercase sm:text-[0.75rem]">
            <Image
              src={BRAND_ASSETS.sparkle}
              alt=""
              width={16}
              height={16}
              className="size-4 motion-safe:animate-pulse"
              aria-hidden
            />
            {hero.badge}
          </p>
          <h1 className="font-heading mt-4 text-[1.85rem] leading-[1.12] font-bold tracking-tight sm:text-[2.5rem] lg:text-[3rem]">
            {hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-white/75 sm:text-[1.125rem]">
            {hero.subtitle}
          </p>
          <p className="mt-4 text-sm text-white/55">{hero.trust}</p>
        </FadeIn>
      </div>

      {/* Transition route / horizon */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        aria-hidden
      >
        <svg
          viewBox="0 0 1440 72"
          className="h-10 w-full text-[#f7f9fc] sm:h-12"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,48 C240,16 480,8 720,28 C960,48 1200,56 1440,24 L1440,72 L0,72 Z"
          />
        </svg>
        <div className="absolute bottom-7 left-1/2 hidden w-[min(42rem,70%)] -translate-x-1/2 border-t border-dashed border-[#3b82f6]/35 sm:block" />
      </div>
    </section>
  );
}
