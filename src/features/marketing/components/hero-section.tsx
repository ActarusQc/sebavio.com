import Image from "next/image";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { HeroPlanner } from "./hero-planner";

/** Bleu marine des avantages — fin exacte du dégradé vertical. */
const HERO_NAVY = "#0E2D46";

export function HeroSection() {
  return (
    <section className="relative w-full min-w-0 overflow-x-clip">
      {/* Photo + overlays + texte — overflow image uniquement */}
      <div
        className="relative min-h-[22rem] overflow-hidden sm:min-h-[32rem] md:min-h-[38rem] lg:min-h-[44rem]"
        style={{ backgroundColor: HERO_NAVY }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src={BRAND_ASSETS.heroCampingcar}
            alt="Camping-car sur une route de montagne au coucher du soleil"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#faf9f6] from-0% via-[#faf9f6]/80 via-40% to-transparent to-85% sm:via-[#faf9f6]/75 sm:via-35% sm:to-70%"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[60%] sm:h-[52%] lg:h-[48%]"
          style={{
            background: `linear-gradient(
              to bottom,
              transparent 0%,
              rgba(14, 45, 70, 0.15) 28%,
              rgba(14, 45, 70, 0.55) 58%,
              rgba(14, 45, 70, 0.88) 82%,
              ${HERO_NAVY} 100%
            )`,
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[90rem] min-w-0 flex-col px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-24 md:pb-28 lg:px-8 lg:pt-20 lg:pb-32">
          <FadeIn className="max-w-xl min-w-0">
            <h1 className="font-heading text-sebavio-navy text-[1.75rem] leading-[1.15] font-bold tracking-tight break-words sm:text-4xl md:text-5xl lg:text-[3.5rem]">
              Planifiez.
              <br />
              Voyagez.
              <br />
              <span className="relative inline-block max-w-full pb-1">
                Profitez pleinement.
                <Image
                  src={BRAND_ASSETS.swoosh}
                  alt=""
                  width={160}
                  height={14}
                  className="absolute -bottom-0.5 left-0 w-[5.5rem] sm:w-[7.5rem] md:w-[9rem]"
                  aria-hidden
                />
              </span>
            </h1>
            <p className="text-sebavio-muted mt-4 max-w-md text-sm leading-relaxed sm:mt-6 sm:text-base md:text-lg">
              Sebavio est votre compagnon intelligent pour des voyages plus
              simples, plus économiques et inoubliables.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Formulaire hors overflow image — largeur bornée, pas de débordement */}
      <div className="relative z-30 mx-auto -mt-14 w-full max-w-[min(1120px,100%)] min-w-0 px-4 sm:-mt-20 sm:px-6 md:-mt-24 lg:px-8">
        <FadeIn delay={0.04} className="min-w-0">
          <HeroPlanner />
        </FadeIn>
      </div>
    </section>
  );
}
