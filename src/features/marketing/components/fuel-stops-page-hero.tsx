import Image from "next/image";
import Link from "next/link";
import { InstitutionalBreadcrumb } from "./institutional-breadcrumb";
import { MarketingCtaButton } from "./marketing-cta-button";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { FUEL_STOPS_PAGE } from "../lib/fuel-stops-page-content";

export function FuelStopsPageHero() {
  const { hero } = FUEL_STOPS_PAGE;

  return (
    <section className="relative overflow-hidden bg-[#050b1c] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={BRAND_ASSETS.heroLandscapeWebp}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(5,11,28,0.94)_0%,rgba(5,11,28,0.82)_50%,rgba(5,11,28,0.6)_100%)]" />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <InstitutionalBreadcrumb
          items={[
            { href: "/", label: "Accueil" },
            { href: "/fonctionnalites", label: "Fonctionnalités" },
            { label: "Planifier les arrêts de carburant" },
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
                href={hero.featuresLink.href}
                className="text-sky-300 underline-offset-2 hover:underline"
              >
                {hero.featuresLink.label}
              </Link>
            </p>
          </div>
          <aside
            className="mx-auto w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.06] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.35)]"
            aria-label="Diagramme conceptuel d’arrêts de ravitaillement"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="relative size-10 overflow-hidden rounded-lg bg-white/10">
                <Image
                  src={BRAND_ASSETS.icons.carburant.teal}
                  alt=""
                  width={40}
                  height={40}
                  className="p-1.5"
                  aria-hidden
                />
              </span>
              <div>
                <p className="text-xs tracking-wide text-sky-300 uppercase">
                  Parcours conceptuel
                </p>
                <p className="text-sm text-white/70">Sans données réelles</p>
              </div>
            </div>
            <ol className="space-y-2 text-sm">
              {[
                "Départ",
                "Autonomie estimée",
                "Arrêt suggéré",
                "Destination",
              ].map((label, index) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#050b1c]/50 px-3 py-2"
                >
                  <span
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-sky-300/40 text-xs text-sky-300"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <span className="text-white/80">{label}</span>
                </li>
              ))}
            </ol>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label="Juge conceptuelle d’autonomie, sans niveau réel"
            >
              <div className="h-full w-2/3 rounded-full bg-sky-400/70" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              Illustration uniquement — aucune station réelle ni autonomie
              chiffrée actuelle.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
