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
import { GuideChecklistSection } from "@/features/marketing/components/guide-checklist-section";
import { GuideRelatedGuides } from "@/features/marketing/components/guide-related-guides";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import {
  BUDGET_FICTIONAL_EXAMPLE,
  BUDGET_FICTIONAL_TOTAL,
  BUDGET_GUIDE,
} from "@/features/marketing/lib/budget-road-trip-content";
import { getGuideBySlug } from "@/features/marketing/lib/guides-registry";
import { getSiteUrl } from "@/lib/site-url";

const SLUG = "budget-road-trip-quebec";
const PATH = `/guides/${SLUG}` as const;

export const metadata = buildTrustPageMetadata({
  path: PATH,
  title: BUDGET_GUIDE.meta.title,
  description: BUDGET_GUIDE.meta.description,
});

function BudgetGuideJsonLd() {
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
        name: BUDGET_GUIDE.meta.title,
        description: BUDGET_GUIDE.meta.description,
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
            name: "Budget road trip au Québec",
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

export default function BudgetRoadTripGuidePage() {
  const guide = getGuideBySlug(SLUG);
  if (!guide) notFound();
  const page = BUDGET_GUIDE;

  return (
    <InstitutionalPageShell>
      <BudgetGuideJsonLd />
      <div className="guide-print-root">
        <InstitutionalHero
          eyebrow={page.hero.eyebrow}
          title={page.hero.title}
          body={page.hero.body}
          breadcrumbs={[
            { href: "/", label: "Accueil" },
            { href: "/guides", label: "Guides" },
            { label: "Budget road trip au Québec" },
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
            <p className="guide-no-print mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link
                href={page.intro.soloGuideLink.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.intro.soloGuideLink.label} →
              </Link>
              <Link
                href={page.intro.familyGuideLink.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.intro.familyGuideLink.label} →
              </Link>
            </p>
            <div className="guide-no-print mt-8">
              <EditorialToc items={page.toc} />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Section
            id={page.categories.id}
            title={page.categories.title}
            lead={page.categories.lead}
          >
            <div className="mt-6 space-y-6">
              {page.categories.items.map((item) => (
                <div key={item.title}>
                  <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[#3d566c]">
                    {item.body}
                  </p>
                  {"link" in item && item.link ? (
                    <p className="guide-no-print mt-2 text-sm">
                      <Link
                        href={item.link.href}
                        className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
                      >
                        {item.link.label} →
                      </Link>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          <Section
            id={page.fixedVariable.id}
            title={page.fixedVariable.title}
            lead={page.fixedVariable.lead}
          >
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                  {page.fixedVariable.fixed.title}
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[#3d566c]">
                  {page.fixedVariable.fixed.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                  {page.fixedVariable.variable.title}
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[#3d566c]">
                  {page.fixedVariable.variable.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#60758a]">
              {page.fixedVariable.note}
            </p>
          </Section>

          <Section
            id={page.method.id}
            title={page.method.title}
            lead={page.method.lead}
          >
            <ol className="mt-5 list-decimal space-y-2 pl-5 text-[#3d566c]">
              {page.method.steps.map((step) => (
                <li key={step} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 font-mono text-sm text-[#082b46]">
              {page.method.formula}
            </p>
          </Section>

          <Section id="exemple" title={BUDGET_FICTIONAL_EXAMPLE.title}>
            <p className="mt-3 text-base leading-relaxed text-[#3d566c]">
              {BUDGET_FICTIONAL_EXAMPLE.scenario}
            </p>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-[#5c4a1f]">
              {BUDGET_FICTIONAL_EXAMPLE.disclaimer}
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="guide-budget-table w-full min-w-[28rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Tableau d’exemple de budget fictif par catégorie
                </caption>
                <thead>
                  <tr className="border-b border-[#c5d4e2] bg-[#f0f5f9]">
                    <th
                      scope="col"
                      className="px-3 py-2 font-semibold text-[#082b46]"
                    >
                      Catégorie
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 font-semibold text-[#082b46]"
                    >
                      Hypothèse fictive
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-semibold text-[#082b46]"
                    >
                      Montant fictif
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {BUDGET_FICTIONAL_EXAMPLE.rows.map((row) => (
                    <tr
                      key={row.category}
                      className="border-b border-[#e6eef5]"
                    >
                      <th
                        scope="row"
                        className="px-3 py-2.5 font-medium text-[#082b46]"
                      >
                        {row.category}
                      </th>
                      <td className="px-3 py-2.5 text-[#3d566c]">
                        {row.hypothesis}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#082b46] tabular-nums">
                        {row.amount}&nbsp;$
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#082b46] bg-[#f7fafc]">
                    <th
                      scope="row"
                      colSpan={2}
                      className="px-3 py-3 font-semibold text-[#082b46]"
                    >
                      Total fictif
                    </th>
                    <td className="px-3 py-3 text-right font-semibold text-[#082b46] tabular-nums">
                      {BUDGET_FICTIONAL_TOTAL}&nbsp;$
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#60758a]">
              {BUDGET_FICTIONAL_EXAMPLE.currencyNote}
            </p>
          </Section>

          <Section
            id={page.styles.id}
            title={page.styles.title}
            lead={page.styles.lead}
          >
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {page.styles.profiles.map((profile) => (
                <div
                  key={profile.title}
                  className="rounded-xl border border-[#d7e0ea] bg-white p-4"
                >
                  <h3 className="font-heading text-base font-semibold text-[#082b46]">
                    {profile.title}
                  </h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-[#3d566c]">
                    {profile.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <GuideChecklistSection
            id={page.forgotten.id}
            title={page.forgotten.title}
            lead={page.forgotten.lead}
            items={page.forgotten.items}
          />

          <Section
            id={page.detours.id}
            title={page.detours.title}
            lead={page.detours.lead}
          >
            <p className="guide-no-print mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {page.detours.links.map((link) => (
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
            id={page.roundTrip.id}
            title={page.roundTrip.title}
            lead={page.roundTrip.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.roundTrip.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">{page.roundTrip.note}</p>
            <p className="guide-no-print mt-2 text-sm">
              <Link
                href={page.roundTrip.fuelLink.href}
                className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
              >
                {page.roundTrip.fuelLink.label} →
              </Link>
            </p>
          </Section>

          <Section
            id={page.margin.id}
            title={page.margin.title}
            lead={page.margin.lead}
          >
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#3d566c]">
              <span className="font-semibold text-[#082b46]">Conseil : </span>
              {page.margin.tip}
            </p>
          </Section>

          <Section
            id={page.reduce.id}
            title={page.reduce.title}
            lead={page.reduce.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.reduce.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section
            id={page.tracking.id}
            title={page.tracking.title}
            lead={page.tracking.lead}
          >
            <ul className="mt-5 list-disc space-y-2 pl-5 text-[#3d566c]">
              {page.tracking.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">{page.tracking.note}</p>
          </Section>

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

          <GuideChecklistSection
            id={page.checklist.id}
            title={page.checklist.title}
            lead={page.checklist.lead}
            items={page.checklist.items}
          />

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
