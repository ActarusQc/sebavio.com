import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  EditorialToc,
  InstitutionalFinalCta,
  InstitutionalHero,
  InstitutionalPageShell,
} from "@/features/marketing";
import { GuideArticleMeta } from "@/features/marketing/components/guide-article-meta";
import { GuideRelatedGuides } from "@/features/marketing/components/guide-related-guides";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import {
  COUPLE_DAY_EXAMPLE,
  COUPLE_GUIDE,
} from "@/features/marketing/lib/couple-road-trip-content";
import { getGuideBySlug } from "@/features/marketing/lib/guides-registry";
import { getSiteUrl } from "@/lib/site-url";

const SLUG = "road-trip-couple-quebec";
const PATH = `/guides/${SLUG}` as const;

export const metadata = buildTrustPageMetadata({
  path: PATH,
  title: COUPLE_GUIDE.meta.title,
  description: COUPLE_GUIDE.meta.description,
});

function CoupleGuideJsonLd() {
  const siteUrl = getSiteUrl();
  const guide = getGuideBySlug(SLUG);
  if (!guide) return null;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${siteUrl}${PATH}#article`,
        url: `${siteUrl}${PATH}`,
        headline: guide.title,
        description: guide.description,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        articleSection: guide.categoryLabel,
        inLanguage: "fr-CA",
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteUrl}${PATH}#webpage`,
        },
        image: [`${siteUrl}${guide.image}`],
        publisher: {
          "@type": "Organization",
          name: "Sebavia",
          url: siteUrl,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}${PATH}#webpage`,
        url: `${siteUrl}${PATH}`,
        name: COUPLE_GUIDE.meta.title,
        description: COUPLE_GUIDE.meta.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: "fr-CA",
        breadcrumb: { "@id": `${siteUrl}${PATH}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}${PATH}#breadcrumb`,
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
            name: "Guides",
            item: `${siteUrl}/guides`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Road trip en couple au Québec",
            item: `${siteUrl}${PATH}`,
          },
        ],
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

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="guide-print-section scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
    >
      <h2
        id={`${id}-title`}
        className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
      >
        {title}
      </h2>
      {lead ? (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#3d566c]">
          {lead}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export default function CoupleRoadTripGuidePage() {
  const guide = getGuideBySlug(SLUG);
  if (!guide) notFound();
  const page = COUPLE_GUIDE;

  return (
    <InstitutionalPageShell>
      <CoupleGuideJsonLd />
      <div className="guide-print-root">
        <InstitutionalHero
          eyebrow={page.hero.eyebrow}
          title={page.hero.title}
          body={page.hero.body}
          breadcrumbs={[
            { href: "/", label: "Accueil" },
            { href: "/guides", label: "Guides" },
            { label: "Road trip en couple au Québec" },
          ]}
          primaryCta={page.hero.primaryCta}
          secondaryCta={page.hero.secondaryCta}
        />

        <div className="border-b border-[#e6eef5] bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <GuideArticleMeta guide={guide} />
            <p className="guide-no-print mt-4 text-sm text-[#60758a]">
              {page.printNote}
            </p>
          </div>
        </div>

        <section className="border-b border-[#e6eef5] py-10 sm:py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-[#082b46]">
              {page.intro.title}
            </h2>
            {page.intro.paragraphs.map((p) => (
              <p
                key={p}
                className="mt-4 text-base leading-relaxed text-[#3d566c]"
              >
                {p}
              </p>
            ))}
            <div className="guide-no-print mt-8">
              <EditorialToc items={page.toc} />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Section
            id={page.style.id}
            title={page.style.title}
            lead={page.style.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.style.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#3d566c]">
              <span className="font-semibold text-[#082b46]">Conseil : </span>
              {page.style.tip}
            </p>
          </Section>

          <Section
            id={page.cadre.id}
            title={page.cadre.title}
            lead={page.cadre.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.cadre.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#3d566c]">
              <span className="font-semibold text-[#082b46]">Conseil : </span>
              {page.cadre.tip}
            </p>
            <p className="guide-no-print mt-3 text-sm">
              <Link
                href={page.cadre.link.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.cadre.link.label} →
              </Link>
            </p>
          </Section>

          <Section
            id={page.rythme.id}
            title={page.rythme.title}
            lead={page.rythme.lead}
          >
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 font-mono text-sm text-[#082b46]">
              {page.rythme.formula}
            </p>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.rythme.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-[#60758a]">{page.rythme.tip}</p>
          </Section>

          <Section
            id={page.activites.id}
            title={page.activites.title}
            lead={page.activites.lead}
          >
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {page.activites.categories.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-[#e6eef5] px-3 py-2 text-sm text-[#3d566c]"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">{page.activites.note}</p>
          </Section>

          <Section
            id={page.repas.id}
            title={page.repas.title}
            lead={page.repas.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.repas.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">{page.repas.tip}</p>
            <p className="guide-no-print mt-2 text-sm">
              <Link
                href={page.repas.guideLink.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.repas.guideLink.label} →
              </Link>
            </p>
          </Section>

          <Section
            id={page.hebergement.id}
            title={page.hebergement.title}
            lead={page.hebergement.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.hebergement.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">
              {page.hebergement.note}
            </p>
          </Section>

          <Section
            id={page.tempsLibre.id}
            title={page.tempsLibre.title}
            lead={page.tempsLibre.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.tempsLibre.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section
            id={page.meteo.id}
            title={page.meteo.title}
            lead={page.meteo.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.meteo.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">{page.meteo.note}</p>
            <p className="guide-no-print mt-2 text-sm">
              <Link
                href={page.meteo.link.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.meteo.link.label} →
              </Link>
            </p>
          </Section>

          <Section
            id={page.carburant.id}
            title={page.carburant.title}
            lead={page.carburant.lead}
          >
            <p className="guide-no-print mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {page.carburant.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
                >
                  {link.label} →
                </Link>
              ))}
            </p>
          </Section>

          <Section
            id={page.budget.id}
            title={page.budget.title}
            lead={page.budget.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.budget.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">{page.budget.tip}</p>
            <p className="guide-no-print mt-2 text-sm">
              <Link
                href={page.budget.link.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.budget.link.label} →
              </Link>
            </p>
          </Section>

          <Section id="exemple" title={COUPLE_DAY_EXAMPLE.title}>
            <p className="mt-3 text-base leading-relaxed text-[#3d566c]">
              {COUPLE_DAY_EXAMPLE.scenario}
            </p>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-[#5c4a1f]">
              {COUPLE_DAY_EXAMPLE.disclaimer}
            </p>
            <ol className="mt-6 space-y-4">
              {COUPLE_DAY_EXAMPLE.blocks.map((block) => (
                <li
                  key={block.title}
                  className="rounded-xl border border-[#d7e0ea] bg-white p-4"
                >
                  <p className="text-xs font-semibold tracking-wide text-[#3b6f9c] uppercase">
                    {block.time}
                  </p>
                  <h3 className="font-heading mt-1 text-lg font-semibold text-[#082b46]">
                    {block.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#3d566c]">
                    {block.body}
                  </p>
                </li>
              ))}
            </ol>
          </Section>

          <Section
            id={page.decisions.id}
            title={page.decisions.title}
            lead={page.decisions.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.decisions.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">{page.decisions.tip}</p>
          </Section>

          <section
            id={page.checklist.id}
            aria-labelledby="checklist-couple-title"
            className="guide-print-section scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
          >
            <h2
              id="checklist-couple-title"
              className="font-heading text-2xl font-bold text-[#082b46] sm:text-3xl"
            >
              {page.checklist.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#3d566c]">
              {page.checklist.lead}
            </p>
            <div className="mt-6 space-y-8">
              {page.checklist.groups.map((group) => (
                <div key={group.title}>
                  <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                    {group.title}
                  </h3>
                  <ul className="guide-checklist mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-base leading-relaxed text-[#1a3348]"
                      >
                        <span
                          className="guide-check-box mt-1 inline-flex h-5 w-5 shrink-0 rounded border border-[#9bb4c9] bg-white"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section
            id={page.sebavia.id}
            aria-labelledby="sebavia-title"
            className="guide-no-print scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
          >
            <h2
              id="sebavia-title"
              className="font-heading text-2xl font-bold text-[#082b46] sm:text-3xl"
            >
              {page.sebavia.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#3d566c]">
              {page.sebavia.lead}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {page.sebavia.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block h-full rounded-xl border border-[#d7e0ea] bg-[#f7fafc] p-4 transition hover:border-[#9bb4c9]"
                  >
                    <span className="font-semibold text-[#082b46]">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-sm text-[#3d566c]">
                      {link.body}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <GuideRelatedGuides guide={guide} />

          <Section id={page.limits.id} title={page.limits.title}>
            {page.limits.paragraphs.map((p) => (
              <p
                key={p}
                className="mt-4 text-base leading-relaxed text-[#3d566c]"
              >
                {p}
              </p>
            ))}
          </Section>
        </div>
      </div>

      <div className="guide-no-print">
        <InstitutionalFinalCta
          title={page.finalCta.title}
          body={page.finalCta.body}
          primary={page.finalCta.primary}
          secondary={page.finalCta.secondary}
        />
        <p className="pb-10 text-center text-sm text-[#60758a]">
          <Link
            href={page.finalCta.guidesLink.href}
            className="text-[#3b6f9c] underline-offset-2 hover:underline"
          >
            {page.finalCta.guidesLink.label}
          </Link>
        </p>
      </div>
    </InstitutionalPageShell>
  );
}
