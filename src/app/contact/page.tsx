import Link from "next/link";
import {
  InstitutionalHero,
  InstitutionalPageShell,
} from "@/features/marketing";
import { ContactForm } from "@/features/marketing/components/contact-form";
import { CONTACT_PAGE } from "@/features/marketing/lib/trust-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { getPublicSupportEmail } from "@/features/marketing/lib/public-contact";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/contact",
  title: CONTACT_PAGE.meta.title,
  description: CONTACT_PAGE.meta.description,
});

function ContactJsonLd({ email }: { email: string | null }) {
  const siteUrl = getSiteUrl();
  const contactPoint = email
    ? {
        "@type": "ContactPoint",
        contactType: "customer support",
        email,
        availableLanguage: ["fr", "French"],
      }
    : undefined;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${siteUrl}/contact#webpage`,
        url: `${siteUrl}/contact`,
        name: CONTACT_PAGE.meta.title,
        description: CONTACT_PAGE.meta.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: "fr-CA",
        ...(contactPoint ? { mainEntity: contactPoint } : {}),
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
            name: "Contact",
            item: `${siteUrl}/contact`,
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

export default function ContactPage() {
  const supportEmail = getPublicSupportEmail();
  const { hero, tips } = CONTACT_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<ContactJsonLd email={supportEmail} />}>
      <InstitutionalHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        body={hero.body}
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Contact" }]}
      />

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] p-6">
            <h2 className="font-heading text-lg font-semibold text-[#082b46]">
              {tips.title}
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#405466]">
              {tips.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#d7e0ea] bg-white p-6">
            <h2 className="font-heading text-lg font-semibold text-[#082b46]">
              Autres ressources
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-[#3b6f9c] hover:underline">
                  Consulter la FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-[#3b6f9c] hover:underline"
                >
                  Voir les forfaits
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-[#3b6f9c] hover:underline"
                >
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
            {supportEmail ? (
              <p className="mt-5 text-sm text-[#405466]">
                Courriel :{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-medium text-[#3b6f9c] hover:underline"
                >
                  {supportEmail}
                </a>
              </p>
            ) : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-[#d7e0ea] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-xl font-semibold text-[#082b46]">
            Formulaire de contact
          </h2>
          <p className="mt-2 text-sm text-[#60758a]">
            Tous les champs sont obligatoires. Aucun délai de réponse fixe n’est
            garanti.
          </p>
          <div className="relative mt-6">
            {supportEmail ? (
              <ContactForm supportEmail={supportEmail} />
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {CONTACT_PAGE.noEmailFallback}
              </p>
            )}
          </div>
        </section>
      </div>
    </InstitutionalPageShell>
  );
}
