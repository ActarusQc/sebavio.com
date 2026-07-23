import Link from "next/link";
import { InstitutionalBreadcrumb } from "./institutional-breadcrumb";
import { MarketingCtaButton } from "./marketing-cta-button";
import { ASSISTANT_PAGE } from "../lib/assistant-page-content";

export function AssistantPageHero() {
  const { hero } = ASSISTANT_PAGE;

  return (
    <section className="relative overflow-hidden bg-[#050b1c] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.22),_transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <InstitutionalBreadcrumb
          items={[
            { href: "/", label: "Accueil" },
            { href: "/fonctionnalites", label: "Fonctionnalités" },
            { label: "Assistant voyage IA" },
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
          <MarketingCtaButton href={hero.secondaryCta.href} variant="secondary">
            {hero.secondaryCta.label}
          </MarketingCtaButton>
        </div>
        <p className="mt-4 text-sm text-white/60">
          <Link
            href={hero.pricingLink.href}
            className="text-sky-300 underline-offset-2 hover:underline"
          >
            {hero.pricingLink.label}
          </Link>
        </p>
      </div>
    </section>
  );
}
