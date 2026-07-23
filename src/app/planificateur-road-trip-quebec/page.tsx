import Link from "next/link";
import type { ReactNode } from "react";
import {
  InstitutionalFinalCta,
  InstitutionalPageShell,
  MarketingCtaButton,
} from "@/features/marketing";
import { RoadTripFaqSection } from "@/features/marketing/components/road-trip-faq-section";
import { RoadTripPageHero } from "@/features/marketing/components/road-trip-page-hero";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/planificateur-road-trip-quebec",
  title: ROAD_TRIP_PAGE.meta.title,
  description: ROAD_TRIP_PAGE.meta.description,
});

function RoadTripJsonLd() {
  const siteUrl = getSiteUrl();
  const path = "/planificateur-road-trip-quebec";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}${path}#webpage`,
        url: `${siteUrl}${path}`,
        name: ROAD_TRIP_PAGE.meta.title,
        description: ROAD_TRIP_PAGE.meta.description,
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
            name: "Planificateur de road trip au Québec",
            item: `${siteUrl}${path}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}${path}#faq`,
        mainEntity: ROAD_TRIP_PAGE.faq.items.map((item) => ({
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

export default function PlanificateurRoadTripQuebecPage() {
  const page = ROAD_TRIP_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<RoadTripJsonLd />}>
      <RoadTripPageHero />

      <SectionShell id="pourquoi" title={page.why.title} lead={page.why.lead}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.why.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#405466]"
            >
              {item}
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="destination" title={page.start.title}>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#d7e0ea] bg-white p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.start.known.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
              {page.start.known.body}
            </p>
          </article>
          <article className="rounded-2xl border border-[#d7e0ea] bg-white p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.start.open.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
              {page.start.open.body}
            </p>
          </article>
        </div>
        <p className="mt-5 text-sm">
          <Link
            href={page.start.assistantLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.start.assistantLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="itineraire"
        title={page.itinerary.title}
        lead={page.itinerary.lead}
        dark
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.itinerary.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/75"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white/70">
          {page.itinerary.example}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          {page.itinerary.note}
        </p>
      </SectionShell>

      <SectionShell id="etapes" title={page.steps.title} lead={page.steps.lead}>
        <dl className="grid gap-4 sm:grid-cols-2">
          {page.steps.items.map((item) => (
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
        id="activites"
        title={page.activities.title}
        lead={page.activities.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466] sm:text-base">
          {page.activities.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#60758a]">
          {page.activities.note}
        </p>
      </SectionShell>

      <SectionShell
        id="hebergement"
        title={page.lodging.title}
        lead={page.lodging.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.lodging.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="carburant"
        title={page.fuel.title}
        lead={page.fuel.lead}
        dark
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/75">
          {page.fuel.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-white/55">{page.fuel.note}</p>
        <p className="mt-4 text-sm">
          <Link
            href={page.fuel.costCalculatorLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.fuel.costCalculatorLink.label}
          </Link>
          {" · "}
          <Link
            href={page.fuel.featuresLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.fuel.featuresLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="ravitaillement"
        title={page.fuelStops.title}
        lead={page.fuelStops.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.fuelStops.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#60758a]">
          {page.fuelStops.note}
        </p>
        <p className="mt-4 text-sm">
          <Link
            href={page.fuelStops.stopsLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.fuelStops.stopsLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="meteo"
        title={page.weather.title}
        lead={page.weather.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.weather.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[#60758a]">{page.weather.note}</p>
      </SectionShell>

      <SectionShell id="groupe" title={page.group.title} lead={page.group.lead}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.group.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#405466]"
            >
              {item}
            </li>
          ))}
        </ul>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-[#60758a]">
          {page.group.examples.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="methode" title={page.method.title} dark>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.method.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
            >
              <p className="text-sm font-semibold text-sky-300">
                Étape {index + 1}
              </p>
              <h3 className="font-heading mt-1 text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </SectionShell>

      <SectionShell id="exemple" title={page.exampleTrip.title}>
        <div
          className="rounded-2xl border border-dashed border-[#3b6f9c]/50 bg-[#f7fafc] p-6"
          role="note"
          aria-label={page.exampleTrip.label}
        >
          <p className="text-xs font-semibold tracking-wide text-[#3b6f9c] uppercase">
            {page.exampleTrip.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#405466]">
            {page.exampleTrip.body}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {page.exampleTrip.items.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-[#d7e0ea] bg-white px-3 py-2 text-sm text-[#60758a]"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-[#60758a]">
            {page.exampleTrip.disclaimer}
          </p>
        </div>
      </SectionShell>

      <SectionShell
        id="regions"
        title={page.regions.title}
        lead={page.regions.lead}
      >
        <ul className="flex flex-wrap gap-2">
          {page.regions.names.map((name) => (
            <li
              key={name}
              className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1.5 text-sm text-[#405466]"
            >
              {name}
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="comparaison" title={page.comparison.title}>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#d7e0ea] bg-white p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              {page.comparison.calculator.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#60758a]">
              {page.comparison.calculator.items.map((item) => (
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
        <p className="mt-5 text-sm text-[#60758a]">{page.comparison.note}</p>
        <p className="mt-3 text-sm">
          <Link
            href={page.comparison.featuresLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.comparison.featuresLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="assistant"
        title={page.assistant.title}
        lead={page.assistant.lead}
        dark
      >
        <p className="text-sm">
          <Link
            href={page.assistant.link.href}
            className="text-sky-300 hover:underline"
          >
            {page.assistant.link.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell id="checklist" title={page.checklist.title}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.checklist.items.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#405466]"
            >
              <span
                className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded border border-[#3b6f9c]/40 text-[#3b6f9c]"
                aria-hidden
              >
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="cas-usage" title="Des scénarios de road trip">
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
        <ul className="grid gap-4 md:grid-cols-3">
          {page.plans.items.map((plan) => (
            <li
              key={plan.name}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
            >
              <h3 className="font-heading text-lg font-semibold">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {plan.body}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6">
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

      <RoadTripFaqSection />

      <InstitutionalFinalCta
        title={page.finalCta.title}
        body={page.finalCta.body}
        primary={page.finalCta.primary}
        secondary={page.finalCta.secondary}
      />
      <p className="bg-[#f7fafc] pb-10 text-center text-sm text-[#60758a]">
        <Link
          href={page.finalCta.assistantLink.href}
          className="text-[#3b6f9c] hover:underline"
        >
          {page.finalCta.assistantLink.label}
        </Link>
        {" · "}
        <Link
          href="/fonctionnalites"
          className="text-[#3b6f9c] hover:underline"
        >
          Fonctionnalités
        </Link>
        {" · "}
        <Link href="/contact" className="text-[#3b6f9c] hover:underline">
          Contact
        </Link>
      </p>
    </InstitutionalPageShell>
  );
}
