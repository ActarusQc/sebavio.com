import type { Metadata } from "next";
import {
  FeatureGrid,
  FinalCta,
  GeoDefinitionSection,
  HeroSection,
  HowItWorksSection,
  JourneyLifecycleSection,
  SiteFooter,
  SiteHeader,
  UseCasesSection,
} from "@/features/marketing";
import { listPublicOfficialPlans } from "@/features/subscriptions/services/public-plans";
import { auth } from "@/lib/auth";
import { LANDING } from "@/features/marketing/lib/landing-content";
import { BRAND_ASSETS } from "@/features/marketing/lib/brand-assets";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://sebavio.com";

export const metadata: Metadata = {
  title: "Sebavio | Copilote intelligent pour planifier vos voyages",
  description:
    "Planifiez votre itinéraire, vos arrêts de carburant, vos activités et votre météo avec Sebavio, le copilote intelligent conçu au Québec.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: SITE_URL,
    siteName: "Sebavio",
    title: "Sebavio | Copilote intelligent pour planifier vos voyages",
    description:
      "Planifiez votre itinéraire, vos arrêts de carburant, vos activités et votre météo avec Sebavio, le copilote intelligent conçu au Québec.",
    images: [
      {
        url: BRAND_ASSETS.heroNightRoad,
        width: 1200,
        height: 630,
        alt: "Sebavio — copilote intelligent de voyage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sebavio | Copilote intelligent pour planifier vos voyages",
    description:
      "Planifiez votre itinéraire, vos arrêts de carburant, vos activités et votre météo avec Sebavio.",
    images: [BRAND_ASSETS.heroNightRoad],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function HomeJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Sebavio",
        url: SITE_URL,
        logo: `${SITE_URL}${BRAND_ASSETS.logo}`,
        description: LANDING.definition,
        areaServed: {
          "@type": "Country",
          name: "Canada",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Sebavio",
        description: LANDING.definition,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "fr-CA",
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Sebavio",
        url: SITE_URL,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        description: LANDING.definition,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CAD",
          description: "Forfait Découverte gratuit",
        },
        provider: { "@id": `${SITE_URL}/#organization` },
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

export default async function Home() {
  const [session, plans] = await Promise.all([
    auth(),
    listPublicOfficialPlans().catch(() => []),
  ]);

  const cards = plans.map((plan) => {
    const price = plan.currentPrices[0] ?? null;
    return {
      slug: plan.internalName,
      publicName: plan.publicName,
      shortDescription: plan.shortDescription,
      unitAmountCents: price?.unitAmount ?? null,
      currency: price?.currency ?? "cad",
    };
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <HomeJsonLd />
      <SiteHeader variant="dark" />
      <main className="flex-1">
        <HeroSection />
        <FeatureGrid />
        <HowItWorksSection
          plans={cards}
          isAuthenticated={Boolean(session?.user?.id)}
        />
        <JourneyLifecycleSection />
        <UseCasesSection />
        <GeoDefinitionSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
