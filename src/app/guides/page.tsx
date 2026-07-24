import Image from "next/image";
import Link from "next/link";
import {
  InstitutionalFinalCta,
  InstitutionalHero,
  InstitutionalPageShell,
} from "@/features/marketing";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import {
  GUIDES_HUB,
  listHubGuides,
} from "@/features/marketing/lib/guides-hub-content";
import {
  formatGuideDate,
  type GuideMeta,
} from "@/features/marketing/lib/guides-registry";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/guides",
  title: GUIDES_HUB.meta.title,
  description: GUIDES_HUB.meta.description,
});

function GuidesHubJsonLd({ guides }: { guides: GuideMeta[] }) {
  const siteUrl = getSiteUrl();
  const path = "/guides";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}${path}#webpage`,
        url: `${siteUrl}${path}`,
        name: GUIDES_HUB.meta.title,
        description: GUIDES_HUB.meta.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: "fr-CA",
        breadcrumb: { "@id": `${siteUrl}${path}#breadcrumb` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: guides.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${siteUrl}/guides/${guide.slug}`,
            name: guide.title,
          })),
        },
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
            name: "Guides",
            item: `${siteUrl}${path}`,
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

function GuideCard({ guide }: { guide: GuideMeta }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#d7e0ea] bg-white shadow-sm transition hover:border-[#9bb4c9]">
      <Link href={`/guides/${guide.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-[#0b1c2e]">
          <Image
            src={guide.image}
            alt={guide.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-[#3b6f9c] uppercase">
            {guide.categoryLabel}
          </p>
          <h2 className="font-heading mt-2 text-xl font-bold text-[#082b46]">
            {guide.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3d566c]">
            {guide.excerpt}
          </p>
          <p className="mt-4 text-xs text-[#60758a]">
            <time dateTime={guide.publishedAt}>
              {formatGuideDate(guide.publishedAt)}
            </time>
            <span aria-hidden> · </span>
            Lecture ≈ {guide.readingTimeMinutes} min
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-[#0b3a5c]">
            Lire le guide →
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function GuidesHubPage() {
  const guides = listHubGuides();

  return (
    <InstitutionalPageShell>
      <GuidesHubJsonLd guides={guides} />
      <InstitutionalHero
        eyebrow={GUIDES_HUB.hero.eyebrow}
        title={GUIDES_HUB.hero.title}
        body={GUIDES_HUB.hero.body}
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Guides" }]}
        primaryCta={guides.length > 0 ? GUIDES_HUB.hero.primaryCta : undefined}
        secondaryCta={GUIDES_HUB.hero.secondaryCta}
      />

      <section className="border-b border-[#e6eef5] py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-[#082b46]">
            {GUIDES_HUB.intro.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#3d566c]">
            {GUIDES_HUB.intro.body}
          </p>
        </div>
      </section>

      <section
        id="guides"
        aria-labelledby="guides-list-title"
        className="border-b border-[#e6eef5] py-12 sm:py-14"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2
            id="guides-list-title"
            className="font-heading text-2xl font-bold text-[#082b46]"
          >
            Guides publiés
          </h2>
          {guides.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] p-6">
              <p className="font-heading text-lg font-semibold text-[#082b46]">
                {GUIDES_HUB.empty.title}
              </p>
              <p className="mt-2 text-[#3d566c]">{GUIDES_HUB.empty.body}</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {guides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-[#e6eef5] py-12 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#082b46]">
              {GUIDES_HUB.howToUse.title}
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-[#3d566c]">
              {GUIDES_HUB.howToUse.items.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] p-6">
            <h2 className="font-heading text-xl font-bold text-[#082b46]">
              {GUIDES_HUB.disclaimer.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3d566c]">
              {GUIDES_HUB.disclaimer.body}
            </p>
          </div>
        </div>
      </section>

      <InstitutionalFinalCta
        title={GUIDES_HUB.finalCta.title}
        body={GUIDES_HUB.finalCta.body}
        primary={GUIDES_HUB.finalCta.primary}
        secondary={GUIDES_HUB.finalCta.secondary}
      />
    </InstitutionalPageShell>
  );
}
