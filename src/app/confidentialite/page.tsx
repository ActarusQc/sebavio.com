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
  PRIVACY_PAGE,
} from "@/features/marketing/lib/trust-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { getPublicSupportEmail } from "@/features/marketing/lib/public-contact";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = buildTrustPageMetadata({
  path: "/confidentialite",
  title: PRIVACY_PAGE.meta.title,
  description: PRIVACY_PAGE.meta.description,
});

function PrivacyJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/confidentialite#webpage`,
        url: `${siteUrl}/confidentialite`,
        name: PRIVACY_PAGE.meta.title,
        description: PRIVACY_PAGE.meta.description,
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
            name: "Confidentialité",
            item: `${siteUrl}/confidentialite`,
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

export default function PrivacyPage() {
  const supportEmail = getPublicSupportEmail();
  const { hero, toc } = PRIVACY_PAGE;

  return (
    <InstitutionalPageShell jsonLd={<PrivacyJsonLd />}>
      <InstitutionalHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        body={hero.body}
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { label: "Confidentialité" },
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
          <LegalSection id="introduction" title="Introduction">
            <p>
              La présente politique décrit les pratiques de Sebavia concernant
              les renseignements personnels liés à l’utilisation du site et des
              services accessibles sur{" "}
              <Link href="/" className="text-[#3b6f9c] hover:underline">
                sebavia.com
              </Link>
              . Elle s’applique aux visiteurs et aux titulaires de compte.
            </p>
            <p>
              Sebavia est une plateforme de planification de voyages routiers.
              Cette page vise à expliquer nos pratiques de façon compréhensible.
              Elle ne remplace pas un avis juridique personnalisé.
            </p>
          </LegalSection>

          <LegalSection id="renseignements" title="Renseignements recueillis">
            <p>Selon l’usage du service, nous pouvons recueillir :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Informations de compte</strong> : adresse courriel, mot
                de passe (stocké sous forme hachée), statut du compte.
              </li>
              <li>
                <strong>Profil</strong> : nom et, le cas échéant, adresse de
                domicile ou lieu de référence que vous fournissez.
              </li>
              <li>
                <strong>Voyages et préférences</strong> : départs et
                destinations, étapes, activités, préférences de voyage,
                véhicules enregistrés et données utiles au calcul du carburant.
              </li>
              <li>
                <strong>Interactions avec l’assistant</strong> : contenu des
                conversations nécessaires à la planification et à l’assistance.
              </li>
              <li>
                <strong>Données techniques</strong> : journaux d’audit (actions,
                adresse IP, agent utilisateur) pour la sécurité et le
                diagnostic.
              </li>
              <li>
                <strong>Paiements</strong> : identifiants et états de
                transaction fournis par le processeur de paiement (pas les
                numéros complets de carte bancaire).
              </li>
              <li>
                <strong>Géolocalisation</strong> : positions associées à un
                voyage en cours, uniquement lorsque vous activez le suivi.
              </li>
            </ul>
            <p>
              Certaines informations proviennent de fournisseurs externes
              (carte, lieux, météo, prix de carburant) à partir des données de
              trajet que vous utilisez.
            </p>
          </LegalSection>

          <LegalSection id="utilisation" title="Utilisation des renseignements">
            <p>Nous utilisons ces renseignements pour :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>créer et gérer votre compte;</li>
              <li>générer, enregistrer et afficher vos voyages;</li>
              <li>calculer itinéraires, estimations et suggestions;</li>
              <li>fournir les fonctions d’intelligence artificielle;</li>
              <li>traiter les achats et abonnements;</li>
              <li>répondre aux demandes de soutien;</li>
              <li>protéger le service contre les abus;</li>
              <li>améliorer le produit de façon générale.</li>
            </ul>
          </LegalSection>

          <LegalSection
            id="intelligence-artificielle"
            title="Intelligence artificielle"
          >
            <p>
              Certaines fonctions (assistant de voyage, planification
              conversationnelle) envoient au fournisseur d’IA les informations
              nécessaires à la réponse, notamment le contenu de la conversation
              et le contexte de voyage pertinent.
            </p>
            <p>
              En production, Sebavia utilise xAI (Grok) pour ces fonctions. Les
              appels sont configurés de façon à ne pas demander le stockage du
              contenu chez le fournisseur lorsque l’option est disponible. Des
              conversations peuvent toutefois être conservées dans Sebavia pour
              assurer le service (historique, sessions de planification).
            </p>
            <p>
              Ne transmettez pas de renseignements confidentiels inutiles (mots
              de passe, numéros de carte, documents sensibles) dans les
              conversations avec l’assistant.
            </p>
          </LegalSection>

          <LegalSection id="geolocalisation" title="Géolocalisation">
            <p>
              Le suivi de position utilise la géolocalisation de votre appareil
              et nécessite votre permission. Il sert à accompagner un voyage en
              cours (affichage et suivi optionnel).
            </p>
            <p>
              Les positions enregistrées côté serveur peuvent être associées au
              voyage pendant qu’il est actif. Elles sont purgées lorsque le
              voyage est clôturé (terminé ou annulé). Vous pouvez retirer la
              permission de localisation dans les réglages de votre navigateur
              ou appareil.
            </p>
          </LegalSection>

          <LegalSection id="paiements" title="Paiements">
            <p>
              Les paiements sont traités par Stripe. Sebavia ne conserve pas les
              numéros complets de carte bancaire : ces données sont gérées par
              le processeur de paiement selon ses propres mesures de sécurité.
            </p>
          </LegalSection>

          <LegalSection id="fournisseurs" title="Fournisseurs de services">
            <p>
              Pour fournir le service, Sebavia s’appuie notamment sur les
              catégories suivantes (selon les fonctions utilisées) :
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>hébergement et infrastructure serveur;</li>
              <li>paiement : Stripe;</li>
              <li>cartographie, géocodage, directions et lieux : Google;</li>
              <li>météo : OpenWeather;</li>
              <li>
                estimation des coûts et des arrêts de carburant : moteur interne
                d’estimation (données de référence agrégées);
              </li>
              <li>
                messagerie transactionnelle : SMTP2GO, pour l’envoi des messages
                liés au service;
              </li>
              <li>intelligence artificielle : xAI.</li>
            </ul>
            <p>
              Ces prestataires traitent uniquement les données nécessaires à
              leur rôle. Aucun outil d’analyse marketing tiers (type pixel
              publicitaire) n’est actuellement intégré dans l’application
              publique.
            </p>
          </LegalSection>

          <LegalSection id="temoins" title="Témoins et technologies similaires">
            <p>Sebavia utilise notamment :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                des témoins (cookies) de session / authentification nécessaires
                à la connexion (Auth.js);
              </li>
              <li>
                le stockage local du navigateur pour la préférence de thème
                d’affichage;
              </li>
              <li>
                le stockage de session du navigateur pour certaines options
                liées au suivi de voyage.
              </li>
            </ul>
            <p>
              Ces technologies sont utilisées pour le fonctionnement et la
              sécurité du service, pas pour de la publicité comportementale
              tierce dans l’état actuel du produit.
            </p>
          </LegalSection>

          <LegalSection id="conservation" title="Conservation">
            <p>
              Les renseignements sont conservés aussi longtemps que nécessaire
              aux finalités décrites (compte actif, voyages enregistrés,
              obligations de sécurité et de facturation), sauf règle plus
              précise déjà en place pour certains éléments, par exemple :
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                sessions de planification assistée abandonnées : rétention
                limitée (environ 30 jours);
              </li>
              <li>
                jetons de vérification de courriel et de réinitialisation de mot
                de passe : durée de validité courte;
              </li>
              <li>positions GPS d’un voyage : purge à la clôture du voyage.</li>
            </ul>
            <p>
              Certaines suppressions dans le système sont logiques (marqueurs de
              suppression) plutôt qu’immédiates et définitives. Il n’existe pas
              encore de parcours libre-service complet « supprimer mon compte »
              dans l’interface ; vous pouvez en faire la demande via{" "}
              <Link href="/contact" className="text-[#3b6f9c] hover:underline">
                la page Contact
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection id="securite" title="Sécurité">
            <p>
              Nous mettons en œuvre des mesures raisonnables pour protéger les
              renseignements, notamment : communications chiffrées (HTTPS),
              contrôle des accès, journalisation d’événements critiques, et
              limitation des secrets aux variables d’environnement serveur.
            </p>
            <p>
              Aucune méthode de transmission ou de stockage n’est totalement
              infaillible. En cas d’incident, nous prendrons les mesures
              appropriées selon la situation.
            </p>
          </LegalSection>

          <LegalSection id="droits" title="Vos droits et demandes">
            <p>Selon le contexte applicable, vous pouvez demander :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>l’accès à certains renseignements vous concernant;</li>
              <li>la correction d’informations inexactes;</li>
              <li>la suppression du compte ou de certaines données;</li>
              <li>des précisions sur l’utilisation de vos renseignements;</li>
              <li>
                le retrait d’une permission (par exemple la géolocalisation sur
                votre appareil).
              </li>
            </ul>
            <p>
              Adressez vos demandes via{" "}
              <Link href="/contact" className="text-[#3b6f9c] hover:underline">
                Contact
              </Link>
              {supportEmail ? (
                <>
                  {" "}
                  ou à{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-[#3b6f9c] hover:underline"
                  >
                    {supportEmail}
                  </a>
                </>
              ) : null}
              . Nous pourrons vous demander de vérifier votre identité avant de
              donner suite.
            </p>
          </LegalSection>

          <LegalSection id="modifications" title="Modifications">
            <p>
              Nous pouvons mettre à jour cette politique pour refléter
              l’évolution du service. La date de mise à jour figurant en tête de
              page sera révisée. En cas de changement important, nous pourrons
              aussi afficher un avis dans le service ou communiquer avec vous
              lorsque c’est approprié.
            </p>
          </LegalSection>

          <LegalSection id="contact-confidentialite" title="Nous joindre">
            <p>
              Pour toute question relative à la confidentialité, utilisez{" "}
              <Link href="/contact" className="text-[#3b6f9c] hover:underline">
                la page Contact
              </Link>
              {supportEmail ? (
                <>
                  {" "}
                  ou l’adresse{" "}
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
            <p>
              Consultez aussi les{" "}
              <Link
                href="/conditions-utilisation"
                className="text-[#3b6f9c] hover:underline"
              >
                conditions d’utilisation
              </Link>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </InstitutionalPageShell>
  );
}
