import Image from "next/image";
import {
  Fuel,
  MapPinCheckInside,
  MessageSquare,
  Play,
  Route,
} from "lucide-react";
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
    <section className="relative isolate overflow-hidden bg-[#050b1c] text-white">
      {/* Fond paysage uniquement — aucun panneau UI dans l’image */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <Image
          src={BRAND_ASSETS.heroLandscapeWebp}
          alt=""
          fill
          priority
          className="object-cover object-[18%_60%] opacity-100"
          sizes="100vw"
        />
        {/* Couches : halo bleu + assombrissement contrôlé (pas de voile opaque) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 55% 70% at 18% 45%, rgba(59,130,246,0.18), transparent 60%),
              linear-gradient(90deg, rgba(5,11,28,0.72) 0%, rgba(5,11,28,0.45) 32%, rgba(5,11,28,0.25) 48%, rgba(5,11,28,0.55) 72%, rgba(5,11,28,0.82) 100%),
              linear-gradient(180deg, rgba(5,11,28,0.35) 0%, transparent 28%, transparent 62%, rgba(5,11,28,0.55) 100%)
            `,
          }}
        />
      </div>

      <div className="mx-auto flex min-h-0 max-w-[100rem] flex-col justify-center px-4 pt-8 pb-10 sm:px-6 sm:pt-10 sm:pb-12 lg:min-h-[760px] lg:px-10 lg:pt-6 lg:pb-12 xl:min-h-[820px]">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-6 xl:gap-10">
          {/* Colonne marketing — pas de FadeIn (évite CLS / retarde LCP) */}
          <div className="max-w-[40.5rem] min-w-0">
            <h1 className="font-heading max-w-[40.5rem] text-[2rem] leading-[1.08] font-bold tracking-tight sm:text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] xl:text-[4.25rem]">
              Votre voyage commence
              <br />
              par une{" "}
              <span className="bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] bg-clip-text text-transparent">
                conversation.
              </span>
            </h1>
            <p className="mt-5 max-w-[38rem] text-[1.05rem] leading-relaxed text-white/75 sm:text-[1.25rem] sm:leading-[1.55]">
              {hero.subtitle}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <MarketingCtaButton href="/register" size="lg">
                {hero.primaryCta}
              </MarketingCtaButton>
              <MarketingCtaButton
                href="/#demo-agent"
                size="lg"
                variant="secondary"
              >
                <Play className="size-4 fill-current" aria-hidden />
                {hero.secondaryCta}
              </MarketingCtaButton>
            </div>

            <ul className="mt-9 grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4 lg:gap-x-3">
              {hero.benefits.map((benefit) => {
                const Icon =
                  BENEFIT_ICONS[benefit.icon as keyof typeof BENEFIT_ICONS] ??
                  MessageSquare;
                return (
                  <li key={benefit.id} className="flex flex-col gap-2">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(59,130,246,0.35),rgba(139,92,246,0.35))]">
                      <Icon className="size-4 text-[#c4b5fd]" aria-hidden />
                    </span>
                    <span className="text-[0.78rem] leading-snug text-white/85 sm:text-[0.8125rem]">
                      {benefit.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-white/50">
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
          </div>

          {/* Interfaces HTML — ordre mobile : trip puis agent */}
          <div className="min-w-0">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-stretch md:justify-center lg:justify-end">
              <div className="w-full max-w-[37.5rem] shrink md:flex-1">
                <TripPreview />
              </div>
              <div className="flex w-full max-w-[21.5rem] shrink-0 md:self-stretch">
                <ConversationPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
