import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EditorialToc,
  InstitutionalFinalCta,
  InstitutionalHero,
  InstitutionalPageShell,
} from "@/features/marketing";
import { GuideArticleMeta } from "@/features/marketing/components/guide-article-meta";
import { GuideChecklistSection } from "@/features/marketing/components/guide-checklist-section";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { CHECKLIST_GUIDE } from "@/features/marketing/lib/checklist-road-trip-content";
import { getGuideBySlug } from "@/features/marketing/lib/guides-registry";
import { getSiteUrl } from "@/lib/site-url";

const SLUG = "checklist-road-trip-quebec";
const PATH = `/guides/${SLUG}` as const;

export const metadata = buildTrustPageMetadata({
  path: PATH,
  title: CHECKLIST_GUIDE.meta.title,
  description: CHECKLIST_GUIDE.meta.description,
});

function ChecklistGuideJsonLd() {
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
        name: CHECKLIST_GUIDE.meta.title,
        description: CHECKLIST_GUIDE.meta.description,
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
            name: "Checklist road trip Québec",
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

export default function ChecklistRoadTripGuidePage() {
  const guide = getGuideBySlug(SLUG);
  if (!guide) notFound();

  return (
    <InstitutionalPageShell>
      <ChecklistGuideJsonLd />
      <div className="guide-print-root">
        <InstitutionalHero
          eyebrow={CHECKLIST_GUIDE.hero.eyebrow}
          title={CHECKLIST_GUIDE.hero.title}
          body={CHECKLIST_GUIDE.hero.body}
          breadcrumbs={[
            { href: "/", label: "Accueil" },
            { href: "/guides", label: "Guides" },
            { label: "Checklist road trip Québec" },
          ]}
          primaryCta={CHECKLIST_GUIDE.hero.primaryCta}
          secondaryCta={CHECKLIST_GUIDE.hero.secondaryCta}
        />

        <div className="border-b border-[#e6eef5] bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <GuideArticleMeta guide={guide} />
            <p className="guide-no-print mt-4 text-sm text-[#60758a]">
              {CHECKLIST_GUIDE.printNote}
            </p>
          </div>
        </div>

        <section className="border-b border-[#e6eef5] py-10 sm:py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-[#082b46]">
              {CHECKLIST_GUIDE.intro.title}
            </h2>
            {CHECKLIST_GUIDE.intro.paragraphs.map((p) => (
              <p
                key={p}
                className="mt-4 text-base leading-relaxed text-[#3d566c]"
              >
                {p}
              </p>
            ))}
            <div className="guide-no-print mt-8">
              <EditorialToc items={CHECKLIST_GUIDE.toc} />
            </div>
          </div>
        </section>

        <div id="checklist" className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {CHECKLIST_GUIDE.sections.map((section) => (
            <GuideChecklistSection
              key={section.id}
              id={section.id}
              title={section.title}
              lead={section.lead}
              items={section.items}
              tip={section.tip}
              productLink={
                "productLink" in section ? section.productLink : null
              }
              productLinks={
                "productLinks" in section ? section.productLinks : undefined
              }
            />
          ))}

          <section
            id={CHECKLIST_GUIDE.sebavia.id}
            aria-labelledby="sebavia-title"
            className="guide-no-print scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
          >
            <h2
              id="sebavia-title"
              className="font-heading text-2xl font-bold text-[#082b46] sm:text-3xl"
            >
              {CHECKLIST_GUIDE.sebavia.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#3d566c]">
              {CHECKLIST_GUIDE.sebavia.lead}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {CHECKLIST_GUIDE.sebavia.links.map((link) => (
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

          <section
            id={CHECKLIST_GUIDE.limits.id}
            aria-labelledby="limites-title"
            className="scroll-mt-28 py-10 sm:py-12"
          >
            <h2
              id="limites-title"
              className="font-heading text-2xl font-bold text-[#082b46] sm:text-3xl"
            >
              {CHECKLIST_GUIDE.limits.title}
            </h2>
            {CHECKLIST_GUIDE.limits.paragraphs.map((p) => (
              <p
                key={p}
                className="mt-4 text-base leading-relaxed text-[#3d566c]"
              >
                {p}
              </p>
            ))}
          </section>
        </div>
      </div>

      <div className="guide-no-print">
        <InstitutionalFinalCta
          title={CHECKLIST_GUIDE.finalCta.title}
          body={CHECKLIST_GUIDE.finalCta.body}
          primary={CHECKLIST_GUIDE.finalCta.primary}
          secondary={CHECKLIST_GUIDE.finalCta.secondary}
        />
      </div>
    </InstitutionalPageShell>
  );
}
