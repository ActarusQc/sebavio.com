import Image from "next/image";
import {
  Fuel,
  MapPinCheckInside,
  MessageSquare,
  Play,
  Route,
} from "lucide-react";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { LANDING } from "../lib/landing-content";
import { ConversationPreview } from "./conversation-preview";
import { MarketingCtaButton } from "./marketing-cta-button";
import { TripPreview } from "./trip-preview";

const BENEFIT_ICONS = {
  MessageSquare,
  Fuel,
  Route,
  MapPinCheck: MapPinCheckInside,
} as const;

export function HeroSection() {
  const { hero } = LANDING;

  return (
    <section className="bg-sebavio-night relative isolate overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src={BRAND_ASSETS.heroNightRoad}
          alt=""
          fill
          priority
          className="object-cover object-[center_40%] opacity-70"
          sizes="100vw"
          aria-hidden
        />
        <div
          className="from-sebavio-night via-sebavio-night/85 to-sebavio-night/40 absolute inset-0 bg-gradient-to-r"
          aria-hidden
        />
        <div
          className="from-sebavio-night to-sebavio-night/50 absolute inset-0 bg-gradient-to-t via-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(1px_1px_at_20%_30%,white,transparent),radial-gradient(1px_1px_at_60%_15%,white,transparent),radial-gradient(1.5px_1.5px_at_80%_40%,white,transparent),radial-gradient(1px_1px_at_40%_70%,white,transparent),radial-gradient(1px_1px_at_10%_60%,white,transparent)] [background-size:100%_100%] opacity-40 motion-safe:animate-pulse"
          aria-hidden
        />
      </div>

      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 pt-10 pb-14 sm:px-6 sm:pt-14 sm:pb-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:px-8 lg:pt-16 lg:pb-24">
        <FadeIn className="min-w-0">
          <h1 className="font-heading text-[1.75rem] leading-[1.15] font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-[3.15rem]">
            {hero.titleBefore}{" "}
            <span className="from-sebavio-gradient-from to-sebavio-gradient-to bg-gradient-to-r bg-clip-text text-transparent">
              {hero.titleHighlight}
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:mt-5 sm:text-base md:text-lg">
            {hero.subtitle}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <MarketingCtaButton
              href="/register"
              size="lg"
              className="w-full sm:w-auto"
            >
              {hero.primaryCta}
            </MarketingCtaButton>
            <MarketingCtaButton
              href="/#demo-agent"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Play className="size-4" aria-hidden />
              {hero.secondaryCta}
            </MarketingCtaButton>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hero.benefits.map((benefit) => {
              const Icon =
                BENEFIT_ICONS[benefit.icon as keyof typeof BENEFIT_ICONS] ??
                MessageSquare;
              return (
                <li
                  key={benefit.id}
                  className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
                >
                  <span className="from-sebavio-gradient-from/30 to-sebavio-gradient-to/30 mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
                    <Icon className="size-4 text-white" aria-hidden />
                  </span>
                  <span className="text-xs leading-snug text-white/85 sm:text-sm">
                    {benefit.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
            {hero.trust.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-2">
                {index > 0 ? (
                  <span className="text-white/25" aria-hidden>
                    |
                  </span>
                ) : null}
                {item}
              </span>
            ))}
          </p>
        </FadeIn>

        <FadeIn
          delay={0.06}
          className="relative mx-auto flex w-full max-w-xl flex-col items-stretch gap-4 sm:max-w-2xl lg:mx-0 lg:max-w-none"
        >
          <div className="flex flex-col items-center gap-4 xl:flex-row xl:items-end xl:justify-end">
            <div className="w-full max-w-md xl:flex-1">
              <TripPreview />
            </div>
            <div className="w-full max-w-xs xl:mb-4 xl:-ml-8 xl:w-[17.5rem] xl:shrink-0">
              <ConversationPreview />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
