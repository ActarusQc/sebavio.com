import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/features/marketing";
import { LANDING } from "@/features/marketing/lib/landing-content";
import { MarketingCtaButton } from "@/features/marketing/components/marketing-cta-button";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Réponses aux questions fréquentes sur Sebavio : planification, carburant, agent conversationnel et différences avec une carte.",
};

export default function FaqPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
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

          <div className="mt-12 flex flex-wrap gap-3">
            <MarketingCtaButton href="/register">
              Planifier mon voyage
            </MarketingCtaButton>
            <MarketingCtaButton href="/#fonctionnalites" variant="soft">
              Voir les fonctionnalités
            </MarketingCtaButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
