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
  formatGuideDate,
  getGuideBySlug,
} from "@/features/marketing/lib/guides-registry";
import {
  WEEKEND_DAY_EXAMPLE,
  WEEKEND_GUIDE,
} from "@/features/marketing/lib/weekend-road-trip-content";
import { getSiteUrl } from "@/lib/site-url";

const SLUG = "escapade-fin-de-semaine-quebec";
const PATH = `/guides/${SLUG}` as const;

export const metadata = buildTrustPageMetadata({
  path: PATH,
  title: WEEKEND_GUIDE.meta.title,
  description: WEEKEND_GUIDE.meta.description,
});

function WeekendGuideJsonLd() {
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
        name: WEEKEND_GUIDE.meta.title,
        description: WEEKEND_GUIDE.meta.description,
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
            name: "Escapade de fin de semaine au Québec",
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

export default function WeekendRoadTripGuidePage() {
  const guide = getGuideBySlug(SLUG);
  if (!guide) notFound();
  const page = WEEKEND_GUIDE;

  return (
    <InstitutionalPageShell>
      <WeekendGuideJsonLd />
      <div className="guide-print-root">
        <InstitutionalHero
          eyebrow={page.hero.eyebrow}
          title={page.hero.title}
          body={page.hero.body}
          breadcrumbs={[
            { href: "/", label: "Accueil" },
            { href: "/guides", label: "Guides" },
            { label: "Escapade de fin de semaine au Québec" },
          ]}
          primaryCta={page.hero.primaryCta}
          secondaryCta={page.hero.secondaryCta}
        />

        <div className="border-b border-[#e6eef5] bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <GuideArticleMeta guide={guide} />
            <p className="sr-only">
              Publié le {formatGuideDate(guide.publishedAt)}
            </p>
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
            id={page.conduite.id}
            title={page.conduite.title}
            lead={page.conduite.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.conduite.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#3d566c]">
              <span className="font-semibold text-[#082b46]">Conseil : </span>
              {page.conduite.tip}
            </p>
            <p className="guide-no-print mt-3 text-sm">
              <Link
                href={page.conduite.link.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.conduite.link.label} →
              </Link>
            </p>
          </Section>

          <Section
            id={page.nuitees.id}
            title={page.nuitees.title}
            lead={page.nuitees.lead}
          >
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] p-4">
                <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                  {page.nuitees.one.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3d566c]">
                  {page.nuitees.one.body}
                </p>
              </div>
              <div className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] p-4">
                <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                  {page.nuitees.two.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3d566c]">
                  {page.nuitees.two.body}
                </p>
              </div>
            </div>
          </Section>

          <Section id={page.destination.id} title={page.destination.title}>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] p-4">
                <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                  {page.destination.known.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3d566c]">
                  {page.destination.known.body}
                </p>
              </div>
              <div className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] p-4">
                <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                  {page.destination.open.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3d566c]">
                  {page.destination.open.body}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#60758a]">
              {page.destination.note}
            </p>
            <p className="guide-no-print mt-2 text-sm">
              <Link
                href={page.destination.link.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.destination.link.label} →
              </Link>
            </p>
          </Section>

          <Section
            id={page.dates.id}
            title={page.dates.title}
            lead={page.dates.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.dates.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#3d566c]">
              <span className="font-semibold text-[#082b46]">Conseil : </span>
              {page.dates.tip}
            </p>
          </Section>

          <Section
            id={page.horaire.id}
            title={page.horaire.title}
            lead={page.horaire.lead}
          >
            <h3 className="font-heading mt-5 text-lg font-semibold text-[#082b46]">
              Risques d’un programme trop rempli
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.horaire.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="font-heading mt-6 text-lg font-semibold text-[#082b46]">
              Structure simple
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.horaire.structure.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-[#60758a]">{page.horaire.tip}</p>
          </Section>

          <Section
            id={page.journee.id}
            title={page.journee.title}
            lead={page.journee.lead}
          >
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 font-mono text-sm text-[#082b46]">
              {page.journee.formula}
            </p>
            <p className="mt-3 text-sm text-[#60758a]">{page.journee.tip}</p>
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
            <p className="guide-no-print mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link
                href={page.activites.guideLink.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.activites.guideLink.label} →
              </Link>
              <Link
                href={page.activites.natureGuideLink.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.activites.natureGuideLink.label} →
              </Link>
            </p>
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
            id={page.retour.id}
            title={page.retour.title}
            lead={page.retour.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.retour.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#3d566c]">
              <span className="font-semibold text-[#082b46]">Important : </span>
              {page.retour.tip}
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
            <p className="guide-no-print mt-3 text-sm">
              <Link
                href={page.budget.link.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.budget.link.label} →
              </Link>
            </p>
          </Section>

          <Section
            id={page.carburant.id}
            title={page.carburant.title}
            lead={page.carburant.lead}
          >
            <p className="mt-4 text-sm text-[#60758a]">{page.carburant.tip}</p>
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
            id={page.profils.id}
            title={page.profils.title}
            lead={page.profils.lead}
          >
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {page.profils.blocks.map((block) => (
                <div
                  key={block.title}
                  className="rounded-xl border border-[#d7e0ea] bg-[#f7fafc] p-4"
                >
                  <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                    {block.title}
                  </h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#3d566c]">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="guide-no-print mt-3 text-sm">
                    <Link
                      href={block.link.href}
                      className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
                    >
                      {block.link.label} →
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="exemple" title={WEEKEND_DAY_EXAMPLE.title}>
            <p className="mt-3 text-base leading-relaxed text-[#3d566c]">
              {WEEKEND_DAY_EXAMPLE.scenario}
            </p>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-[#5c4a1f]">
              {WEEKEND_DAY_EXAMPLE.disclaimer}
            </p>
            <ol className="mt-6 space-y-4">
              {WEEKEND_DAY_EXAMPLE.blocks.map((block) => (
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

          <section
            id={page.checklist.id}
            aria-labelledby="checklist-escapade-title"
            className="guide-print-section scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
          >
            <h2
              id="checklist-escapade-title"
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
            aria-labelledby="sebavia-weekend-title"
            className="guide-no-print scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
          >
            <h2
              id="sebavia-weekend-title"
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
            <p className="guide-no-print mt-4 text-sm">
              <Link
                href="/conditions-utilisation"
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                Conditions d’utilisation →
              </Link>
            </p>
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
