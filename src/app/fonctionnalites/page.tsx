import Link from "next/link";
import {
  FeaturesCapabilitySection,
  FeaturesExampleList,
  FeaturesInlineLink,
} from "@/features/marketing/components/features-capability-section";
import { FeaturesCategoryNav } from "@/features/marketing/components/features-category-nav";
import { FeaturesHowItWorks } from "@/features/marketing/components/features-how-it-works";
import { FeaturesPageHero } from "@/features/marketing/components/features-page-hero";
import { FeaturesPlansTeaser } from "@/features/marketing/components/features-plans-teaser";
import { FeaturesUseCases } from "@/features/marketing/components/features-use-cases";
import {
  InstitutionalFinalCta,
  InstitutionalPageShell,
} from "@/features/marketing";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/fonctionnalites",
  title: FEATURES_PAGE.meta.title,
  description: FEATURES_PAGE.meta.description,
});

function FeaturesJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/fonctionnalites#webpage`,
        url: `${siteUrl}/fonctionnalites`,
        name: FEATURES_PAGE.meta.title,
        description: FEATURES_PAGE.meta.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: "fr-CA",
        mainEntity: { "@id": `${siteUrl}/fonctionnalites#feature-list` },
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
            name: "Fonctionnalités",
            item: `${siteUrl}/fonctionnalites`,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/fonctionnalites#feature-list`,
        name: "Fonctionnalités Sebavia",
        numberOfItems: FEATURES_PAGE.categories.length,
        itemListElement: FEATURES_PAGE.categories.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.title,
          url: `${siteUrl}/fonctionnalites#${category.id}`,
          description: category.summary,
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

export default function FeaturesPage() {
  const {
    assistant,
    itinerary,
    activities,
    weather,
    fuel,
    personalization,
    finalCta,
  } = FEATURES_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<FeaturesJsonLd />}>
      <FeaturesPageHero />
      <FeaturesCategoryNav />

      <FeaturesCapabilitySection
        id="assistant"
        title={assistant.title}
        lead={assistant.lead}
        items={assistant.capabilities}
        note={assistant.note}
      >
        <FeaturesExampleList examples={assistant.examples} />
        <FeaturesInlineLink
          href={assistant.moreLink.href}
          label={assistant.moreLink.label}
        />
      </FeaturesCapabilitySection>

      <FeaturesCapabilitySection
        id="itineraire"
        title={itinerary.title}
        lead={itinerary.lead}
        items={itinerary.items}
        note={itinerary.note}
      >
        <FeaturesInlineLink
          href={itinerary.roadTripLink.href}
          label={itinerary.roadTripLink.label}
        />
        <FeaturesInlineLink
          href={itinerary.guidesLink.href}
          label={itinerary.guidesLink.label}
        />
        <FeaturesInlineLink
          href={itinerary.faqLink.href}
          label={itinerary.faqLink.label}
        />
      </FeaturesCapabilitySection>

      <FeaturesCapabilitySection
        id="activites"
        title={activities.title}
        lead={activities.lead}
        items={activities.items}
        note={activities.note}
      />

      <FeaturesCapabilitySection
        id="meteo"
        title={weather.title}
        lead={weather.lead}
        items={weather.items}
        note={weather.note}
      >
        <FeaturesInlineLink
          href={weather.weatherPageLink.href}
          label={weather.weatherPageLink.label}
        />
      </FeaturesCapabilitySection>

      <FeaturesCapabilitySection
        id="carburant"
        title={fuel.title}
        lead={fuel.lead}
        items={fuel.items}
        note={fuel.note}
      >
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm leading-relaxed text-[#405466]">
          {fuel.example}
        </p>
        <FeaturesInlineLink
          href={fuel.costCalculatorLink.href}
          label={fuel.costCalculatorLink.label}
        />
        <FeaturesInlineLink
          href={fuel.stopsPlannerLink.href}
          label={fuel.stopsPlannerLink.label}
        />
      </FeaturesCapabilitySection>

      <FeaturesCapabilitySection
        id="personnalisation"
        title={personalization.title}
        lead={personalization.lead}
        items={personalization.items}
      >
        <FeaturesInlineLink
          href={personalization.soloGuideLink.href}
          label={personalization.soloGuideLink.label}
        />
        <FeaturesInlineLink
          href={personalization.coupleGuideLink.href}
          label={personalization.coupleGuideLink.label}
        />
        <FeaturesInlineLink
          href={personalization.familyGuideLink.href}
          label={personalization.familyGuideLink.label}
        />
      </FeaturesCapabilitySection>

      <FeaturesHowItWorks />
      <FeaturesUseCases />
      <FeaturesPlansTeaser />

      <InstitutionalFinalCta
        title={finalCta.title}
        body={finalCta.body}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
      />
      <p className="bg-[#f7fafc] pb-10 text-center text-sm text-[#60758a]">
        {finalCta.links.map((link, index) => (
          <span key={link.href}>
            {index > 0 ? " · " : null}
            <Link href={link.href} className="text-[#3b6f9c] hover:underline">
              {link.label}
            </Link>
          </span>
        ))}
        {" · "}
        <Link href="/a-propos" className="text-[#3b6f9c] hover:underline">
          À propos
        </Link>
      </p>
    </InstitutionalPageShell>
  );
}
