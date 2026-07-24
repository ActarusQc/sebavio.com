import Link from "next/link";
import type { ReactNode } from "react";
import {
  InstitutionalFinalCta,
  InstitutionalPageShell,
  MarketingCtaButton,
} from "@/features/marketing";
import { WeatherFaqSection } from "@/features/marketing/components/weather-faq-section";
import { WeatherPageHero } from "@/features/marketing/components/weather-page-hero";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { WEATHER_PAGE } from "@/features/marketing/lib/weather-page-content";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/meteo-voyage",
  title: WEATHER_PAGE.meta.title,
  description: WEATHER_PAGE.meta.description,
});

function WeatherJsonLd() {
  const siteUrl = getSiteUrl();
  const path = "/meteo-voyage";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}${path}#webpage`,
        url: `${siteUrl}${path}`,
        name: WEATHER_PAGE.meta.title,
        description: WEATHER_PAGE.meta.description,
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
            name: "Météo du voyage",
            item: `${siteUrl}${path}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}${path}#faq`,
        mainEntity: WEATHER_PAGE.faq.items.map((item) => ({
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

export default function MeteoVoyagePage() {
  const page = WEATHER_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<WeatherJsonLd />}>
      <WeatherPageHero />

      <SectionShell
        id="contexte"
        title={page.context.title}
        lead={page.context.lead}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.context.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#405466]"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm leading-relaxed text-[#405466]">
          {page.context.example}
        </p>
        <p className="mt-3 text-sm text-[#60758a]">{page.context.note}</p>
      </SectionShell>

      <SectionShell
        id="depart-destination"
        title={page.dual.title}
        lead={page.dual.lead}
        dark
      >
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-sky-300/25 bg-sky-500/10 p-5">
            <h3 className="font-heading text-lg font-semibold">
              {page.dual.departure.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-white/70">
              {page.dual.departure.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-5">
            <h3 className="font-heading text-lg font-semibold">
              {page.dual.arrival.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-white/70">
              {page.dual.arrival.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <p className="mt-5 text-sm text-white/55">{page.dual.note}</p>
      </SectionShell>

      <SectionShell id="dates" title={page.dates.title} lead={page.dates.lead}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.dates.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#60758a]">
          {page.dates.note}
        </p>
      </SectionShell>

      <SectionShell
        id="plusieurs-jours"
        title={page.multiDay.title}
        lead={page.multiDay.lead}
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          {page.multiDay.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#405466]"
            >
              {item}
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="activites"
        title={page.activities.title}
        lead={page.activities.lead}
        dark
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.activities.examples.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/75"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-white/55">{page.activities.note}</p>
        <p className="mt-3 text-sm">
          <Link
            href={page.activities.roadTripLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.activities.roadTripLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="preparation"
        title={page.packing.title}
        lead={page.packing.lead}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.packing.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#405466]"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[#60758a]">{page.packing.note}</p>
      </SectionShell>

      <SectionShell
        id="conditions-routieres"
        title={page.roads.title}
        lead={page.roads.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.roads.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {page.roads.note}
        </p>
        <p className="mt-3 text-sm">
          <Link
            href={page.roads.termsLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.roads.termsLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell
        id="indicateurs"
        title={page.conditions.title}
        lead={page.conditions.lead}
        dark
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {page.conditions.items.map((item) => (
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
        <p className="mt-5 text-sm text-white/55">{page.conditions.note}</p>
      </SectionShell>

      <SectionShell
        id="evolution"
        title={page.updates.title}
        lead={page.updates.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.updates.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[#60758a]">{page.updates.note}</p>
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
      </SectionShell>

      <SectionShell id="exemple" title="Exemple conceptuel">
        <figure
          className="rounded-2xl border border-dashed border-[#3b6f9c]/50 bg-[#f7fafc] p-6"
          aria-labelledby="exemple-meteo-caption"
        >
          <figcaption
            id="exemple-meteo-caption"
            className="text-xs font-semibold tracking-wide text-[#3b6f9c] uppercase"
          >
            {page.example.label}
          </figcaption>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[page.example.departure, page.example.arrival].map((block) => (
              <article
                key={block.title}
                className="rounded-xl border border-[#d7e0ea] bg-white p-4"
              >
                <h3 className="font-heading text-base font-semibold text-[#082b46]">
                  {block.title}
                </h3>
                <dl className="mt-3 space-y-1.5 text-sm text-[#60758a]">
                  <div>
                    <dt className="inline font-medium text-[#405466]">
                      Moment :{" "}
                    </dt>
                    <dd className="inline">{block.moment}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#405466]">
                      Condition :{" "}
                    </dt>
                    <dd className="inline">{block.condition}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#405466]">
                      Température fictive :{" "}
                    </dt>
                    <dd className="inline">{block.temp}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#405466]">
                      Préparation :{" "}
                    </dt>
                    <dd className="inline">{block.tip}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#60758a]">
            {page.example.disclaimer}
          </p>
        </figure>
      </SectionShell>

      <SectionShell
        id="adapter"
        title={page.adapt.title}
        lead={page.adapt.lead}
        dark
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.adapt.items.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/75"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-white/55">{page.adapt.note}</p>
        <p className="mt-3 text-sm">
          <Link
            href={page.adapt.assistantLink.href}
            className="text-sky-300 hover:underline"
          >
            {page.adapt.assistantLink.label}
          </Link>
        </p>
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
              {"guideLink" in item && item.guideLink ? (
                <p className="mt-3 text-sm">
                  <Link
                    href={item.guideLink.href}
                    className="text-[#3b6f9c] hover:underline"
                  >
                    {item.guideLink.label} →
                  </Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="limites"
        title={page.limits.title}
        lead={page.limits.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.limits.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm">
          <Link
            href={page.limits.faqLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.limits.faqLink.label}
          </Link>
          {" · "}
          <Link
            href={page.limits.termsLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.limits.termsLink.label}
          </Link>
        </p>
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

      <WeatherFaqSection />

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
