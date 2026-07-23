import Image from "next/image";
import Link from "next/link";
import { InstitutionalBreadcrumb } from "./institutional-breadcrumb";
import { MarketingCtaButton } from "./marketing-cta-button";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { ROAD_TRIP_PAGE } from "../lib/road-trip-page-content";

export function RoadTripPageHero() {
  const { hero } = ROAD_TRIP_PAGE;

  return (
    <section className="relative overflow-hidden bg-[#050b1c] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={BRAND_ASSETS.heroLandscapeWebp}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(5,11,28,0.92)_0%,rgba(5,11,28,0.78)_55%,rgba(5,11,28,0.55)_100%)]" />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <InstitutionalBreadcrumb
          items={[
            { href: "/", label: "Accueil" },
            { href: "/fonctionnalites", label: "Fonctionnalités" },
            { label: "Planificateur de road trip au Québec" },
          ]}
          className="[&_[aria-current=page]]:text-white [&_a]:text-sky-300 [&_span]:text-white/70"
        />
        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-medium tracking-wide text-sky-300 uppercase">
              {hero.eyebrow}
            </p>
            <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              {hero.body}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <MarketingCtaButton href={hero.primaryCta.href}>
                {hero.primaryCta.label}
              </MarketingCtaButton>
              <MarketingCtaButton
                href={hero.secondaryCta.href}
                variant="secondary"
              >
                {hero.secondaryCta.label}
              </MarketingCtaButton>
            </div>
            <p className="mt-4 text-sm text-white/60">
              <Link
                href={hero.assistantLink.href}
                className="text-sky-300 underline-offset-2 hover:underline"
              >
                {hero.assistantLink.label}
              </Link>
            </p>
          </div>
          <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-white/15 shadow-[0_24px_48px_rgba(0,0,0,0.35)] lg:block">
            <Image
              src={BRAND_ASSETS.heroLandscapeWebp}
              alt="Route nocturne québécoise sous un ciel étoilé — ambiance Sebavia"
              width={640}
              height={480}
              className="h-full w-full object-cover"
              sizes="(min-width: 1024px) 400px, 0px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
