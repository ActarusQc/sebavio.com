import Link from "next/link";
import {
  InstitutionalFinalCta,
  InstitutionalHero,
  InstitutionalPageShell,
} from "@/features/marketing";
import { ABOUT_PAGE } from "@/features/marketing/lib/trust-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { getSiteUrl } from "@/lib/site-url";
import { MarketingCtaButton } from "@/features/marketing/components/marketing-cta-button";

export const metadata = buildTrustPageMetadata({
  path: "/a-propos",
  title: ABOUT_PAGE.meta.title,
  description: ABOUT_PAGE.meta.description,
});

function AboutJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${siteUrl}/a-propos#webpage`,
        url: `${siteUrl}/a-propos`,
        name: ABOUT_PAGE.meta.title,
        description: ABOUT_PAGE.meta.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
        inLanguage: "fr-CA",
      },
      {
        "@type": "BreadcrumbList",
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
            name: "À propos",
            item: `${siteUrl}/a-propos`,
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

export default function AboutPage() {
  const {
    hero,
    name,
    mission,
    differentiators,
    quebec,
    commitments,
    finalCta,
  } = ABOUT_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<AboutJsonLd />}>
      <InstitutionalHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        body={hero.body}
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "À propos" }]}
        primaryCta={hero.primaryCta}
        secondaryCta={hero.secondaryCta}
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <section>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#082b46]">
            {name.title}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] p-5">
              <p className="font-heading text-lg font-semibold text-[#082b46]">
                Seba
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#405466]">
                {name.seba}
              </p>
            </div>
            <div className="rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] p-5">
              <p className="font-heading text-lg font-semibold text-[#082b46]">
                Via
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#405466]">
                {name.via}
              </p>
            </div>
          </div>
          <p className="mt-5 text-base leading-relaxed text-[#405466]">
            {name.result}
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#082b46]">
            {mission.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#405466]">
            {mission.body}
          </p>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-base text-[#405466]">
            {mission.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#082b46]">
            {differentiators.title}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {differentiators.items.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#d7e0ea] bg-white p-5 shadow-sm"
              >
                <h3 className="font-heading text-base font-semibold text-[#082b46]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-[#d7e0ea] bg-[#050b1c] p-6 text-white sm:p-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            {quebec.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/75">
            {quebec.body}
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#082b46]">
            {commitments.title}
          </h2>
          <div className="mt-6 space-y-4">
            {commitments.items.map((item) => (
              <div
                key={item.title}
                className="border-l-2 border-[#3b82f6] pl-4"
              >
                <h3 className="font-heading text-base font-semibold text-[#082b46]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[#60758a]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-[#60758a]">
            En savoir plus :{" "}
            <Link href="/faq" className="text-[#3b6f9c] hover:underline">
              FAQ
            </Link>
            {" · "}
            <Link href="/pricing" className="text-[#3b6f9c] hover:underline">
              Tarifs
            </Link>
            {" · "}
            <Link href="/contact" className="text-[#3b6f9c] hover:underline">
              Contact
            </Link>
          </p>
          <div className="mt-6">
            <MarketingCtaButton href="/register">
              Planifier mon voyage
            </MarketingCtaButton>
          </div>
        </section>
      </div>

      <InstitutionalFinalCta
        title={finalCta.title}
        body={finalCta.body}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
      />
    </InstitutionalPageShell>
  );
}
