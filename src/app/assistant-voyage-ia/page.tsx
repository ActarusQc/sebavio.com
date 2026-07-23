import Link from "next/link";
import type { ReactNode } from "react";
import { AssistantConversationDemo } from "@/features/marketing/components/assistant-conversation-demo";
import { AssistantFaqSection } from "@/features/marketing/components/assistant-faq-section";
import { AssistantPageHero } from "@/features/marketing/components/assistant-page-hero";
import {
  InstitutionalFinalCta,
  InstitutionalPageShell,
  MarketingCtaButton,
} from "@/features/marketing";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/assistant-voyage-ia",
  title: ASSISTANT_PAGE.meta.title,
  description: ASSISTANT_PAGE.meta.description,
});

function AssistantJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/assistant-voyage-ia#webpage`,
        url: `${siteUrl}/assistant-voyage-ia`,
        name: ASSISTANT_PAGE.meta.title,
        description: ASSISTANT_PAGE.meta.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: "fr-CA",
        breadcrumb: { "@id": `${siteUrl}/assistant-voyage-ia#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/assistant-voyage-ia#breadcrumb`,
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
            name: "Assistant voyage IA",
            item: `${siteUrl}/assistant-voyage-ia`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/assistant-voyage-ia#faq`,
        mainEntity: ASSISTANT_PAGE.faq.items.map((item) => ({
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

export default function AssistantVoyageIaPage() {
  const page = ASSISTANT_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<AssistantJsonLd />}>
      <AssistantPageHero />
      <AssistantConversationDemo />

      <SectionShell
        id="differenciation"
        title={page.differentiation.title}
        lead={page.differentiation.lead}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.differentiation.items.map((item) => (
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
        id="parler-naturellement"
        title={page.natural.title}
        lead={page.natural.lead}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.natural.examples.map((example) => (
            <li
              key={example}
              className="rounded-2xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#405466]"
            >
              <span className="text-[#60758a]">« </span>
              {example}
              <span className="text-[#60758a]"> »</span>
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell id="processus" title={page.process.title}>
        <ol className="grid gap-4 sm:grid-cols-2">
          {page.process.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-[#d7e0ea] bg-white p-5"
            >
              <p className="text-sm font-semibold text-[#3b6f9c]">
                Étape {index + 1}
              </p>
              <h3 className="font-heading mt-1 text-lg font-semibold text-[#082b46]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </SectionShell>

      <SectionShell id="capacites" title={page.capabilities.title} dark>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {page.capabilities.cards.map((card) => (
            <li
              key={card.title}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
            >
              <h3 className="font-heading text-lg font-semibold">
                {card.title}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-white/70">
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="evoluer"
        title={page.evolve.title}
        lead={page.evolve.lead}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466] sm:text-base">
          {page.evolve.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm text-[#60758a]">
          {page.evolve.note}
        </p>
        <p className="mt-4 text-sm">
          <Link
            href={page.evolve.roadTripLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.evolve.roadTripLink.label}
          </Link>
          {" · "}
          <Link
            href={page.evolve.fuelCostLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.evolve.fuelCostLink.label}
          </Link>
          {" · "}
          <Link
            href={page.evolve.fuelStopsLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.evolve.fuelStopsLink.label}
          </Link>
          {" · "}
          <Link
            href={page.evolve.weatherPageLink.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.evolve.weatherPageLink.label}
          </Link>
        </p>
      </SectionShell>

      <SectionShell id="voix" title={page.voice.title} lead={page.voice.lead}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#405466]">
          {page.voice.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {page.voice.safety}
        </p>
      </SectionShell>

      <SectionShell
        id="personnalisation"
        title={page.personalization.title}
        lead={page.personalization.lead}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {page.personalization.items.map((item) => (
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
        id="fiabilite"
        title={page.reliability.title}
        lead={page.reliability.lead}
      >
        <p className="text-sm leading-relaxed text-[#405466] sm:text-base">
          {page.reliability.body}
        </p>
        <p className="mt-4 text-sm text-[#60758a]">
          {page.reliability.links.map((link, i) => (
            <span key={link.href}>
              {i > 0 ? " · " : null}
              <Link href={link.href} className="text-[#3b6f9c] hover:underline">
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      </SectionShell>

      <SectionShell
        id="confidentialite"
        title={page.privacy.title}
        lead={page.privacy.lead}
      >
        <p className="text-sm leading-relaxed text-[#405466] sm:text-base">
          {page.privacy.body}
        </p>
        <p className="mt-4 text-sm">
          <Link
            href={page.privacy.link.href}
            className="text-[#3b6f9c] hover:underline"
          >
            {page.privacy.link.label}
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
        <p className="mt-6 text-sm text-white/60">{page.plans.note}</p>
        <div className="mt-5">
          <MarketingCtaButton href={page.plans.cta.href}>
            {page.plans.cta.label}
          </MarketingCtaButton>
        </div>
      </SectionShell>

      <AssistantFaqSection />

      <InstitutionalFinalCta
        title={page.finalCta.title}
        body={page.finalCta.body}
        primary={page.finalCta.primary}
        secondary={page.finalCta.secondary}
      />
      <p className="bg-[#f7fafc] pb-10 text-center text-sm text-[#60758a]">
        <Link
          href={page.finalCta.featuresLink.href}
          className="text-[#3b6f9c] hover:underline"
        >
          {page.finalCta.featuresLink.label}
        </Link>
        {" · "}
        <Link href="/contact" className="text-[#3b6f9c] hover:underline">
          Contact
        </Link>
      </p>
    </InstitutionalPageShell>
  );
}
