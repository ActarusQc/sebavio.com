import Link from "next/link";
import type { ReactNode } from "react";
import {
  InstitutionalFinalCta,
  InstitutionalPageShell,
  MarketingCtaButton,
} from "@/features/marketing";
import { FuelCostFaqSection } from "@/features/marketing/components/fuel-cost-faq-section";
import { FuelCostPageHero } from "@/features/marketing/components/fuel-cost-page-hero";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { FUEL_COST_PAGE } from "@/features/marketing/lib/fuel-cost-page-content";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/calculateur-cout-carburant-voyage",
  title: FUEL_COST_PAGE.meta.title,
  description: FUEL_COST_PAGE.meta.description,
});

function FuelCostJsonLd() {
  const siteUrl = getSiteUrl();
  const path = "/calculateur-cout-carburant-voyage";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}${path}#webpage`,
        url: `${siteUrl}${path}`,
        name: FUEL_COST_PAGE.meta.title,
        description: FUEL_COST_PAGE.meta.description,
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
            name: "Calculateur de coût de carburant",
            item: `${siteUrl}${path}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}${path}#faq`,
        mainEntity: FUEL_COST_PAGE.faq.items.map((item) => ({
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

export default function CalculateurCoutCarburantVoyagePage() {
  const page = FUEL_COST_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<FuelCostJsonLd />}>
      <FuelCostPageHero />

      <SectionShell
        id="facteurs"
        title={page.factors.title}
        lead={page.factors.lead}
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {page.factors.items.map((item) => (
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
        id="formule"
        title={page.formula.title}
        lead={page.formula.lead}
        dark
      >
        <div className="space-y-3">
          <p className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 font-mono text-sm text-sky-100 sm:text-base">
            {page.formula.liters}
          </p>
          <p className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 font-mono text-sm text-sky-100 sm:text-base">
            {page.formula.cost}
          </p>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-white/60">
          {page.formula.note}
        </p>
      </SectionShell>

      <SectionShell id="exemple" title="Exemple pédagogique">
        <figure
          className="rounded-2xl border border-dashed border-[#3b6f9c]/50 bg-[#f7fafc] p-6"
          aria-labelledby="exemple-calcul-caption"
        >
          <figcaption
            id="exemple-calcul-caption"
            className="text-xs font-semibold tracking-wide text-[#3b6f9c] uppercase"
          >
            {page.example.label}
          </figcaption>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3">
              <dt className="text-xs text-[#60758a]">Distance</dt>
              <dd className="mt-1 font-semibold text-[#082b46]">
                {page.example.distanceKm} km
              </dd>
            </div>
            <div className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3">
              <dt className="text-xs text-[#60758a]">Consommation</dt>
              <dd className="mt-1 font-semibold text-[#082b46]">
                {page.example.consumption} L/100 km
              </dd>
            </div>
            <div className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3">
              <dt className="text-xs text-[#60758a]">Prix fictif</dt>
              <dd className="mt-1 font-semibold text-[#082b46]">
                {page.example.pricePerLiter} $/L
              </dd>
            </div>
          </dl>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#405466]">
            {page.example.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-4 text-base font-semibold text-[#082b46]">
            Résultat illustratif : {page.example.liters} L · {page.example.cost}
            &nbsp;$
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#60758a]">
            {page.example.disclaimer}
          </p>
        </figure>
      </SectionShell>

      <SectionShell
        id="ecarts"
        title={page.variance.title}
        lead={page.variance.lead}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#3b6f9c]/35 bg-[#f0f6fb] p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.variance.considered.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#405466]">
              {page.variance.considered.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[#d7e0ea] bg-white p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.variance.realWorld.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#60758a]">
              {page.variance.realWorld.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </SectionShell>

      <SectionShell
        id="plein-initial"
        title={page.initialTank.title}
        lead={page.initialTank.lead}
        dark
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          {page.initialTank.items.map((item) => (
            <div
              key={item.term}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
            >
              <dt className="font-heading text-base font-semibold">
                {item.term}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-white/65">
                {item.definition}
              </dd>
            </div>
          ))}
        </dl>
      </SectionShell>

      <SectionShell id="types-trajet" title={page.tripTypes.title}>
        <ul className="grid gap-4 md:grid-cols-3">
          {page.tripTypes.items.map((item) => (
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
        <p className="mt-5 text-sm text-[#60758a]">{page.tripTypes.note}</p>
      </SectionShell>

      <SectionShell
        id="vehicule"
        title={page.vehicle.title}
        lead={page.vehicle.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.vehicle.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#60758a]">
          {page.vehicle.note}
        </p>
      </SectionShell>

      <SectionShell
        id="mise-a-jour"
        title={page.updates.title}
        lead={page.updates.lead}
        dark
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.updates.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/75"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm">
          <Link
            href={page.updates.roadTripLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.updates.roadTripLink.label}
          </Link>
          {" · "}
          <Link
            href={page.updates.budgetGuideLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.updates.budgetGuideLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell id="comparaison" title={page.comparison.title}>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#d7e0ea] bg-white p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.comparison.manual.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#60758a]">
              {page.comparison.manual.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[#3b6f9c]/35 bg-[#f0f6fb] p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.comparison.sebavia.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#405466]">
              {page.comparison.sebavia.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </SectionShell>

      <SectionShell
        id="libelles"
        title={page.costLabels.title}
        lead={page.costLabels.lead}
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          {page.costLabels.items.map((item) => (
            <div
              key={item.term}
              className="rounded-2xl border border-[#d7e0ea] bg-white p-5"
            >
              <dt className="font-heading text-base font-semibold text-[#082b46]">
                {item.term}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-[#60758a]">
                {item.definition}
              </dd>
            </div>
          ))}
        </dl>
      </SectionShell>

      <SectionShell
        id="arrets"
        title={page.stopsSummary.title}
        lead={page.stopsSummary.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.stopsSummary.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[#60758a]">{page.stopsSummary.note}</p>
        <p className="mt-4 text-sm">
          <Link
            href={page.stopsSummary.stopsLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.stopsSummary.stopsLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell id="conseils" title={page.tips.title} dark>
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.tips.items.map((item) => (
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
        <div className="mt-2">
          <MarketingCtaButton href={page.plans.cta.href}>
            {page.plans.cta.label}
          </MarketingCtaButton>
        </div>
        <p className="mt-4 text-sm text-white/55">
          Les limites d’usage sont décrites dans les{" "}
          <Link
            href="/conditions-utilisation"
            className="text-sky-300 hover:underline"
          >
            conditions d’utilisation
          </Link>
          .
        </p>
      </SectionShell>

      <FuelCostFaqSection />

      <InstitutionalFinalCta
        title={page.finalCta.title}
        body={page.finalCta.body}
        primary={page.finalCta.primary}
        secondary={page.finalCta.secondary}
      />
      <p className="bg-[#f7fafc] pb-10 text-center text-sm text-[#60758a]">
        <Link
          href={page.finalCta.roadTripLink.href}
          className="text-[#3b6f9c] hover:underline"
        >
          {page.finalCta.roadTripLink.label}
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
          href="/assistant-voyage-ia"
          className="text-[#3b6f9c] hover:underline"
        >
          Assistant voyage IA
        </Link>
        {" · "}
        <Link href="/contact" className="text-[#3b6f9c] hover:underline">
          Contact
        </Link>
      </p>
    </InstitutionalPageShell>
  );
}
