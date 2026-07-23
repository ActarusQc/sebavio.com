import Link from "next/link";
import type { ReactNode } from "react";
import {
  InstitutionalFinalCta,
  InstitutionalPageShell,
  MarketingCtaButton,
} from "@/features/marketing";
import { FuelStopsFaqSection } from "@/features/marketing/components/fuel-stops-faq-section";
import { FuelStopsPageHero } from "@/features/marketing/components/fuel-stops-page-hero";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { FUEL_STOPS_PAGE } from "@/features/marketing/lib/fuel-stops-page-content";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/planifier-arrets-carburant",
  title: FUEL_STOPS_PAGE.meta.title,
  description: FUEL_STOPS_PAGE.meta.description,
});

function FuelStopsJsonLd() {
  const siteUrl = getSiteUrl();
  const path = "/planifier-arrets-carburant";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}${path}#webpage`,
        url: `${siteUrl}${path}`,
        name: FUEL_STOPS_PAGE.meta.title,
        description: FUEL_STOPS_PAGE.meta.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: "fr-CA",
        breadcrumb: { "@id": `${siteUrl}${path}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}${path}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Fonctionnalités",
            item: `${siteUrl}/fonctionnalites`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Planifier les arrêts de carburant",
            item: `${siteUrl}${path}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}${path}#faq`,
        mainEntity: FUEL_STOPS_PAGE.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function SectionShell({
  id,
  title,
  lead,
  children,
  dark = false,
}: {
  id?: string;
  title: string;
  lead?: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={
        dark
          ? "scroll-mt-28 border-b border-white/10 bg-[#050b1c] py-12 text-white sm:py-14"
          : "scroll-mt-28 border-b border-[#e6eef5] py-12 sm:py-14"
      }
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id={id ? `${id}-title` : undefined}
          className={
            dark
              ? "font-heading text-2xl font-bold tracking-tight sm:text-3xl"
              : "font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
          }
        >
          {title}
        </h2>
        {lead ? (
          <p
            className={
              dark
                ? "mt-3 max-w-3xl text-base leading-relaxed text-white/70"
                : "mt-3 max-w-3xl text-base leading-relaxed text-[#405466]"
            }
          >
            {lead}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export default function PlanifierArretsCarburantPage() {
  const page = FUEL_STOPS_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<FuelStopsJsonLd />}>
      <FuelStopsPageHero />

      <SectionShell id="distinction" title={page.distinction.title}>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#d7e0ea] bg-white p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.distinction.cost.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#60758a]">
              {page.distinction.cost.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[#3b6f9c]/35 bg-[#f0f6fb] p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.distinction.autonomy.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#405466]">
              {page.distinction.autonomy.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <p className="mt-5 text-sm">
          <Link
            href={page.distinction.costLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.distinction.costLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="autonomie"
        title={page.autonomyFactors.title}
        lead={page.autonomyFactors.lead}
        dark
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {page.autonomyFactors.items.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
            >
              <h3 className="font-heading text-lg font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm leading-relaxed text-white/55">
          {page.autonomyFactors.realWorld}
        </p>
      </SectionShell>

      <SectionShell id="processus" title={page.process.title}>
        <ol className="grid gap-3 sm:grid-cols-2">
          {page.process.steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#405466]"
            >
              <span
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#082b46] text-xs font-semibold text-white"
                aria-hidden
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {page.process.note}
        </p>
      </SectionShell>

      <SectionShell
        id="niveau-initial"
        title={page.initialLevel.title}
        lead={page.initialLevel.lead}
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {page.initialLevel.cases.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-[#d7e0ea] bg-white p-5"
            >
              <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm">
          <Link
            href={page.initialLevel.costLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.initialLevel.costLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="detours"
        title={page.detours.title}
        lead={page.detours.lead}
        dark
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.detours.examples.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/75"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-white/60">{page.detours.note}</p>
        <p className="mt-3 text-sm">
          <Link
            href={page.detours.roadTripLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.detours.roadTripLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="position"
        title={page.position.title}
        lead={page.position.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.position.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[#60758a]">{page.position.note}</p>
      </SectionShell>

      <SectionShell
        id="prix-pratique"
        title={page.priceVsPractical.title}
        lead={page.priceVsPractical.lead}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.priceVsPractical.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#405466]"
            >
              {item}
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="verification"
        title={page.verify.title}
        lead={page.verify.lead}
        dark
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.verify.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/75"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-white/60">{page.verify.note}</p>
        <p className="mt-3 text-sm">
          <Link
            href={page.verify.termsLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.verify.termsLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="secteurs"
        title={page.remote.title}
        lead={page.remote.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.remote.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="exemple" title="Exemple conceptuel de planification">
        <figure
          className="rounded-2xl border border-dashed border-[#3b6f9c]/50 bg-[#f7fafc] p-6"
          aria-labelledby="exemple-arrets-caption"
        >
          <figcaption
            id="exemple-arrets-caption"
            className="text-xs font-semibold tracking-wide text-[#3b6f9c] uppercase"
          >
            {page.example.label}
          </figcaption>
          <ol className="mt-4 space-y-3">
            {page.example.steps.map((step, index) => (
              <li
                key={step.label}
                className="flex gap-3 rounded-xl border border-[#d7e0ea] bg-white px-4 py-3"
              >
                <span
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#082b46] text-xs font-semibold text-white"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-heading text-sm font-semibold text-[#082b46]">
                    {step.label}
                  </p>
                  <p className="text-sm text-[#60758a]">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-[#60758a]">
            {page.example.disclaimer}
          </p>
        </figure>
      </SectionShell>

      <SectionShell id="checklist" title={page.checklist.title} dark>
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.checklist.items.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/75"
            >
              <span
                className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded border border-sky-300/40 text-sky-300"
                aria-hidden
              >
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="cas-usage" title="Des scénarios concrets">
        <ul className="grid gap-4 sm:grid-cols-2">
          {page.useCases.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-[#d7e0ea] bg-white p-5"
            >
              <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="forfaits"
        title={page.plans.title}
        lead={page.plans.lead}
        dark
      >
        <MarketingCtaButton href={page.plans.cta.href}>
          {page.plans.cta.label}
        </MarketingCtaButton>
      </SectionShell>

      <FuelStopsFaqSection />

      <InstitutionalFinalCta
        title={page.finalCta.title}
        body={page.finalCta.body}
        primary={page.finalCta.primary}
        secondary={page.finalCta.secondary}
      />
      <p className="bg-[#f7fafc] pb-10 text-center text-sm text-[#60758a]">
        <Link
          href={page.finalCta.costLink.href}
          className="text-[#3b6f9c] hover:underline"
        >
          {page.finalCta.costLink.label}
        </Link>
        {" · "}
        <Link
          href="/fonctionnalites"
          className="text-[#3b6f9c] hover:underline"
        >
          Fonctionnalités
        </Link>
        {" · "}
        <Link
          href="/planificateur-road-trip-quebec"
          className="text-[#3b6f9c] hover:underline"
        >
          Planificateur de road trip
        </Link>
        {" · "}
        <Link href="/contact" className="text-[#3b6f9c] hover:underline">
          Contact
        </Link>
      </p>
    </InstitutionalPageShell>
  );
}
