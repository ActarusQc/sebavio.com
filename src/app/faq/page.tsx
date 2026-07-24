import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/features/marketing";
import { LANDING } from "@/features/marketing/lib/landing-content";
import { BRAND_ASSETS } from "@/features/marketing/lib/brand-assets";
import { MarketingCtaButton } from "@/features/marketing/components/marketing-cta-button";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();
const FAQ_PATH = `${siteUrl}/faq`;
const FAQ_TITLE = "FAQ Sebavia | Planification de voyages routiers avec l’IA";
const FAQ_DESCRIPTION =
  "Trouvez les réponses à vos questions sur Sebavia, la création d’itinéraires, l’assistant IA, les forfaits et la planification de voyages routiers.";

export const metadata: Metadata = {
  title: {
    absolute: FAQ_TITLE,
  },
  description: FAQ_DESCRIPTION,
  alternates: {
    canonical: FAQ_PATH,
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: FAQ_PATH,
    siteName: "Sebavia",
    title: FAQ_TITLE,
    description: FAQ_DESCRIPTION,
    images: [
      {
        url: BRAND_ASSETS.heroLandscape,
        width: 1200,
        height: 630,
        alt: "Sebavia — copilote intelligent de voyage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: FAQ_TITLE,
    description: FAQ_DESCRIPTION,
    images: [BRAND_ASSETS.heroLandscape],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING.geo.questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function FaqPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <FaqJsonLd />
      <SiteHeader variant="light" />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-sm font-medium text-[#3b82f6]">
            <Link href="/" className="hover:underline">
              Accueil
            </Link>
            {" / "}
            FAQ
          </p>
          <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-[#082b46] sm:text-4xl">
            {LANDING.geo.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[#60758a]">
            {LANDING.definition}
          </p>

          <dl className="mt-10 space-y-8">
            {LANDING.geo.questions.map((item) => (
              <div key={item.q}>
                <dt className="font-heading text-lg font-semibold text-[#082b46]">
                  {item.q}
                </dt>
                <dd className="mt-2 text-base leading-relaxed text-[#60758a]">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-sm text-[#60758a]">
            Pour organiser un voyage routier de bout en bout :{" "}
            <Link
              href="/planificateur-road-trip-quebec"
              className="text-[#3b6f9c] hover:underline"
            >
              Planifier un road trip au Québec
            </Link>
            . Pour estimer l’essence :{" "}
            <Link
              href="/calculateur-cout-carburant-voyage"
              className="text-[#3b6f9c] hover:underline"
            >
              Calculateur de coût de carburant
            </Link>
            . Pour les arrêts :{" "}
            <Link
              href="/planifier-arrets-carburant"
              className="text-[#3b6f9c] hover:underline"
            >
              Planifier les arrêts de carburant
            </Link>
            . Pour les prévisions :{" "}
            <Link
              href="/meteo-voyage"
              className="text-[#3b6f9c] hover:underline"
            >
              Météo du voyage
            </Link>
            . Pour la préparation :{" "}
            <Link
              href="/guides/checklist-road-trip-quebec"
              className="text-[#3b6f9c] hover:underline"
            >
              Checklist road trip Québec
            </Link>
            . Pour le budget global :{" "}
            <Link
              href="/guides/budget-road-trip-quebec"
              className="text-[#3b6f9c] hover:underline"
            >
              Budget road trip Québec
            </Link>
            . Pour voyager avec des enfants :{" "}
            <Link
              href="/guides/road-trip-famille-quebec"
              className="text-[#3b6f9c] hover:underline"
            >
              Road trip en famille
            </Link>
            . Pour une escapade à deux :{" "}
            <Link
              href="/guides/road-trip-couple-quebec"
              className="text-[#3b6f9c] hover:underline"
            >
              Road trip en couple
            </Link>
            . Pour un voyage seul :{" "}
            <Link
              href="/guides/road-trip-solo-quebec"
              className="text-[#3b6f9c] hover:underline"
            >
              Road trip solo
            </Link>{" "}
            (
            <Link href="/guides" className="text-[#3b6f9c] hover:underline">
              tous les guides
            </Link>
            ).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <MarketingCtaButton href="/register">
              Planifier mon voyage
            </MarketingCtaButton>
            <MarketingCtaButton href="/fonctionnalites" variant="soft">
              Voir les fonctionnalités
            </MarketingCtaButton>
            <MarketingCtaButton href="/assistant-voyage-ia" variant="soft">
              Assistant voyage IA
            </MarketingCtaButton>
          </div>
          <p className="mt-6 text-sm text-[#60758a]">
            Vous ne trouvez pas votre réponse ?{" "}
            <Link href="/contact" className="text-[#3b6f9c] hover:underline">
              Contactez-nous
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
