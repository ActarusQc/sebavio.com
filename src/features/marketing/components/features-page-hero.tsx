import Image from "next/image";
import { InstitutionalBreadcrumb } from "./institutional-breadcrumb";
import { MarketingCtaButton } from "./marketing-cta-button";
import { FEATURES_PAGE } from "../lib/features-page-content";

export function FeaturesPageHero() {
  const { hero } = FEATURES_PAGE;

  return (
    <section className="relative overflow-hidden bg-[#050b1c] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.22),_transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-14">
        <div>
          <InstitutionalBreadcrumb
            items={[
              { href: "/", label: "Accueil" },
              { label: "Fonctionnalités" },
            ]}
            className="[&_[aria-current=page]]:text-white [&_a]:text-sky-300 [&_span]:text-white/70"
          />
          <p className="mt-5 text-sm font-medium tracking-wide text-sky-300 uppercase">
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
        </div>
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.35)] lg:max-w-none">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            width={hero.image.width}
            height={hero.image.height}
            priority
            sizes="(max-width: 1024px) 90vw, 420px"
            className="h-auto w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
