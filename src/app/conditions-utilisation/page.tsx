import Link from "next/link";
import {
  EditorialToc,
  InstitutionalHero,
  InstitutionalPageShell,
  LegalSection,
} from "@/features/marketing";
import {
  LEGAL_LAST_UPDATED_ISO,
  LEGAL_LAST_UPDATED_LABEL,
  LEGAL_VERSION,
  TERMS_PAGE,
} from "@/features/marketing/lib/trust-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import {
  getPublicSupportEmail,
  OFFICIAL_PUBLIC_EMAIL,
} from "@/features/marketing/lib/public-contact";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/conditions-utilisation",
  title: TERMS_PAGE.meta.title,
  description: TERMS_PAGE.meta.description,
});

function TermsJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/conditions-utilisation#webpage`,
        url: `${siteUrl}/conditions-utilisation`,
        name: TERMS_PAGE.meta.title,
        description: TERMS_PAGE.meta.description,
        dateModified: LEGAL_LAST_UPDATED_ISO,
        isPartOf: { "@id": `${siteUrl}/#website` },
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
            name: "Conditions d’utilisation",
            item: `${siteUrl}/conditions-utilisation`,
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

export default function TermsPage() {
  const supportEmail = getPublicSupportEmail();
  const { hero, toc } = TERMS_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<TermsJsonLd />}>
      <InstitutionalHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        body={hero.body}
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { label: "Conditions d’utilisation" },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <p className="text-sm text-[#60758a]">
          Dernière mise à jour :{" "}
          <time dateTime={LEGAL_LAST_UPDATED_ISO}>
            {LEGAL_LAST_UPDATED_LABEL}
          </time>
          {" · "}
          Version {LEGAL_VERSION}
        </p>

        <EditorialToc items={toc} className="mt-6" />

        <div className="mt-12 space-y-12">
          <LegalSection id="acceptation" title="Acceptation">
            <p>
              En accédant à Sebavia ou en créant un compte, vous acceptez les
              présentes conditions ainsi que la{" "}
              <Link
                href="/confidentialite"
                className="text-[#3b6f9c] hover:underline"
              >
                politique de confidentialité
              </Link>
              . Si vous n’acceptez pas ces conditions, n’utilisez pas le
              service.
            </p>
          </LegalSection>

          <LegalSection id="service" title="Description du service">
            <p>
              Sebavia est un outil d’aide à la planification de voyages
              routiers. Il peut proposer des itinéraires, des estimations, des
              suggestions d’activités, des informations météo et un assistant
              conversationnel.
            </p>
            <p>
              Ces informations peuvent évoluer ou contenir des imprécisions.
              Sebavia ne garantit pas les conditions routières, la disponibilité
              d’un commerce, le prix exact du carburant, l’absence de fermeture,
              l’exactitude absolue de la météo, la sécurité d’un trajet ni les
              heures d’ouverture.
            </p>
          </LegalSection>

          <LegalSection id="voyageur" title="Responsabilité du voyageur">
            <p>Vous demeurez responsable de :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>vérifier les informations importantes avant de partir;</li>
              <li>
                respecter le Code de la route et les consignes de sécurité;
              </li>
              <li>
                ne pas manipuler l’application d’une façon dangereuse pendant la
                conduite;
              </li>
              <li>
                tenir compte des conditions réelles (météo, chantiers,
                fermetures);
              </li>
              <li>
                consulter les avis officiels et adapter le voyage à votre
                situation.
              </li>
            </ul>
          </LegalSection>

          <LegalSection id="comptes" title="Comptes">
            <p>
              Vous êtes responsable de la confidentialité de vos identifiants et
              de l’exactitude des renseignements fournis. Le partage abusif d’un
              compte ou toute utilisation frauduleuse peut entraîner des
              mesures, y compris la suspension.
            </p>
          </LegalSection>

          <LegalSection
            id="utilisation-acceptable"
            title="Utilisation acceptable"
          >
            <p>Il est interdit notamment :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>d’utiliser le service à des fins illégales;</li>
              <li>d’abuser des ressources ou de contourner les limites;</li>
              <li>de tenter d’accéder sans autorisation aux systèmes;</li>
              <li>d’extraire massivement des données;</li>
              <li>de perturber le fonctionnement du service;</li>
              <li>
                d’utiliser les fonctions d’IA pour produire des contenus
                nuisibles ou illégaux.
              </li>
            </ul>
          </LegalSection>

          <LegalSection id="contenu" title="Contenu de l’utilisateur">
            <p>
              Vous conservez vos droits sur les informations que vous saisissez
              (voyages, messages, préférences). Vous accordez à Sebavia une
              licence limitée, non exclusive, pour traiter, enregistrer et
              afficher ce contenu uniquement dans le cadre de la fourniture du
              service.
            </p>
          </LegalSection>

          <LegalSection id="ia" title="Intelligence artificielle">
            <p>
              Les réponses de l’assistant peuvent contenir des erreurs. Elles
              doivent être vérifiées et ne remplacent pas les informations
              officielles. Elles ne constituent pas un avis juridique, médical,
              financier ou de sécurité.
            </p>
          </LegalSection>

          <LegalSection id="forfaits" title="Forfaits et paiements">
            <p>
              Les forfaits actuellement proposés sont décrits sur la page{" "}
              <Link href="/pricing" className="text-[#3b6f9c] hover:underline">
                Tarifs
              </Link>{" "}
              et peuvent évoluer :
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Découverte</strong> : accès gratuit d’aperçu, avec des
                fonctionnalités limitées;
              </li>
              <li>
                <strong>Pass 30 jours</strong> : achat unique donnant accès
                complet pendant 30 jours, sans renouvellement automatique;
              </li>
              <li>
                <strong>Sebavia Plus</strong> : abonnement récurrent annuel.
                L’accès se poursuit jusqu’à la fin de la période déjà payée
                lorsque l’abonnement est annulé selon les mécanismes
                disponibles.
              </li>
            </ul>
            <p>
              Les prix, taxes, périodes de facturation et fonctionnalités
              applicables sont ceux présentés sur la page Tarifs et confirmés au
              moment de l’achat. Les montants sont en dollars canadiens; les
              taxes applicables peuvent s’ajouter selon votre situation.
            </p>
            <p>
              Les paiements sont traités par Stripe. Pour toute demande liée à
              une facturation, communiquez avec Sebavia à l’adresse{" "}
              <a
                href={`mailto:${OFFICIAL_PUBLIC_EMAIL}`}
                className="text-[#3b6f9c] hover:underline"
              >
                {OFFICIAL_PUBLIC_EMAIL}
              </a>{" "}
              ou à partir de la{" "}
              <Link href="/contact" className="text-[#3b6f9c] hover:underline">
                page Contact
              </Link>
              . La demande sera analysée selon les circonstances et les droits
              prévus par les lois applicables.
            </p>
          </LegalSection>

          <LegalSection id="propriete" title="Propriété intellectuelle">
            <p>
              Le nom Sebavia, le design, le code, les textes, les illustrations
              et les éléments visuels du service sont protégés. Les droits des
              fournisseurs externes (cartes, données, marques) restent leur
              propriété. Vous n’acquérez aucun droit de propriété sur ces
              éléments en utilisant Sebavia.
            </p>
          </LegalSection>

          <LegalSection id="disponibilite" title="Disponibilité">
            <p>
              Le service peut être interrompu pour entretien, mise à jour,
              panne, problème chez un fournisseur ou événement hors de notre
              contrôle. Aucune disponibilité de 100 % n’est promise.
            </p>
          </LegalSection>

          <LegalSection
            id="responsabilite"
            title="Limitation de responsabilité"
          >
            <p>
              Dans la mesure permise par la loi applicable, Sebavia et ses
              exploitants ne peuvent être tenus responsables des dommages
              indirects, ni des décisions de voyage prises sur la seule base des
              estimations ou suggestions du service, sous réserve des droits
              prévus par les lois applicables.
            </p>
          </LegalSection>

          <LegalSection id="suspension" title="Suspension et fermeture">
            <p>
              Nous pouvons suspendre ou restreindre l’accès en cas de fraude,
              d’abus, d’atteinte à la sécurité, de non-paiement ou de violation
              grave des présentes conditions.
            </p>
          </LegalSection>

          <LegalSection id="modifications" title="Modifications">
            <p>
              Ces conditions peuvent évoluer. La date de mise à jour en tête de
              page sera révisée. Les changements importants pourront être
              signalés dans le service.
            </p>
          </LegalSection>

          <LegalSection id="droit" title="Droit applicable">
            <p>
              Sebavia est une plateforme québécoise. Dans la mesure permise par
              la loi applicable, ces conditions s’interprètent conformément aux
              lois du Québec et du Canada. En cas de litige, les tribunaux
              compétents seront déterminés selon le droit applicable et le
              statut légal de l’exploitant, sous réserve des droits prévus par
              les lois applicables.
            </p>
          </LegalSection>

          <LegalSection id="contact-conditions" title="Contact">
            <p>
              Pour toute question :{" "}
              <Link href="/contact" className="text-[#3b6f9c] hover:underline">
                page Contact
              </Link>
              {supportEmail ? (
                <>
                  {" "}
                  ou{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-[#3b6f9c] hover:underline"
                  >
                    {supportEmail}
                  </a>
                </>
              ) : null}
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </InstitutionalPageShell>
  );
}
