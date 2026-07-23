/**
 * Contenu des pages de confiance — basé uniquement sur les pratiques confirmées.
 * Date de mise à jour figée (à modifier manuellement lors d’un vrai changement).
 */

export const LEGAL_LAST_UPDATED_ISO = "2026-07-23";
export const LEGAL_LAST_UPDATED_LABEL = "23 juillet 2026";

export const ABOUT_PAGE = {
  meta: {
    title: "À propos de Sebavia | Le copilote des voyages routiers",
    description:
      "Découvrez la mission de Sebavia, un copilote intelligent conçu pour simplifier la planification de vos voyages routiers au Québec.",
  },
  hero: {
    eyebrow: "À propos",
    title: "Sebavia, l’étoile qui guide votre route",
    body: "Sebavia est un copilote intelligent de planification de voyages routiers. Il réunit itinéraire, véhicule, carburant, météo, activités et conversation au même endroit pour simplifier la préparation de vos déplacements.",
    primaryCta: { href: "/register", label: "Créer un compte" },
    secondaryCta: { href: "/pricing", label: "Voir les forfaits" },
  },
  name: {
    title: "L’origine du nom",
    seba: "« Seba » évoque l’étoile, ce repère qui guide les voyageurs depuis toujours.",
    via: "« Via » signifie la route, le chemin vers une destination ou une nouvelle aventure.",
    result:
      "Sebavia unit ces deux idées : l’étoile qui guide votre route. Une plateforme pensée pour vous accompagner avant et pendant le voyage.",
  },
  mission: {
    title: "Notre mission",
    body: "Rendre la planification d’un voyage routier plus simple, plus claire et plus concrète — en réunissant les informations importantes et en vous aidant à prévoir l’itinéraire, les activités, la météo, les pauses et le carburant.",
    points: [
      "Simplifier la préparation d’un déplacement ou d’un road trip",
      "Centraliser les informations utiles au même endroit",
      "Accompagner l’utilisateur avant le départ et sur la route",
      "Adapter le plan lorsque le voyage évolue",
    ],
  },
  differentiators: {
    title: "Ce qui distingue Sebavia",
    items: [
      {
        title: "Assistant conversationnel",
        body: "Créez ou modifiez un voyage en langage naturel, comme avec un copilote.",
      },
      {
        title: "Itinéraires calculés",
        body: "Obtenez distance, durée et étapes à partir de votre trajet et de vos préférences.",
      },
      {
        title: "Plan de carburant",
        body: "Estimez les arrêts selon votre véhicule, sa consommation et le niveau d’essence au départ.",
      },
      {
        title: "Activités et détours",
        body: "Ajoutez des étapes ou des suggestions : Sebavia recalcule le parcours.",
      },
      {
        title: "Météo sur le trajet",
        body: "Consultez des prévisions pour mieux anticiper les conditions du voyage.",
      },
      {
        title: "Votre véhicule au centre",
        body: "Tenez compte des caractéristiques de votre véhicule et de son entretien.",
      },
    ],
  },
  quebec: {
    title: "Pensé pour les voyages routiers au Québec",
    body: "Sebavia est une plateforme québécoise, conçue en priorité pour les réalités des road trips au Québec — sans se limiter exclusivement à cette région lorsque votre trajet le permet.",
  },
  commitments: {
    title: "Nos engagements",
    items: [
      {
        title: "Simplicité",
        body: "Des parcours clairs, du premier message à l’itinéraire prêt.",
      },
      {
        title: "Clarté",
        body: "Des estimations et des suggestions compréhensibles, sans jargon inutile.",
      },
      {
        title: "Transparence",
        body: "Des pages qui expliquent le service, les forfaits et l’usage des données.",
      },
      {
        title: "Amélioration continue",
        body: "Sebavia évolue avec les retours des voyageurs et les besoins réels sur la route.",
      },
      {
        title: "Respect des données",
        body: "Nous limitons la collecte à ce qui est utile au service et documentons nos pratiques.",
      },
    ],
  },
  finalCta: {
    title: "Prêt à planifier avec Sebavia ?",
    body: "Créez un compte gratuit ou découvrez les forfaits adaptés à votre façon de voyager.",
    primary: { href: "/register", label: "Commencer gratuitement" },
    secondary: { href: "/pricing", label: "Comparer les forfaits" },
  },
} as const;

export const CONTACT_PAGE = {
  meta: {
    title: "Contactez Sebavia | Soutien et questions",
    description:
      "Contactez l’équipe Sebavia pour une question sur votre compte, un forfait, la planification d’un voyage ou le fonctionnement du service.",
  },
  hero: {
    eyebrow: "Contact",
    title: "Nous écrire",
    body: "Une question sur votre compte, un forfait, un problème technique ou une demande liée à vos renseignements personnels ? Écrivez-nous : nous lirons votre message avec attention.",
  },
  subjects: [
    "Question générale sur Sebavia",
    "Compte et connexion",
    "Forfaits et facturation",
    "Problème technique",
    "Renseignements personnels / confidentialité",
    "Suggestion d’amélioration",
  ],
  tips: {
    title: "Pour nous aider à vous répondre",
    items: [
      "Décrivez clairement votre situation et le résultat attendu.",
      "Indiquez le navigateur ou l’appareil utilisé si le problème est technique.",
      "Ne joignez jamais votre mot de passe ni vos numéros de carte bancaire complets.",
      "Pour une demande liée à vos données, précisez l’adresse courriel de votre compte.",
    ],
  },
  form: {
    nameLabel: "Nom",
    emailLabel: "Adresse courriel",
    categoryLabel: "Sujet",
    messageLabel: "Message",
    consentLabel:
      "J’accepte que Sebavia utilise ces renseignements pour traiter ma demande.",
    submitLabel: "Envoyer le message",
    successTitle: "Message envoyé",
    successBody:
      "Merci. Votre message a bien été transmis. Nous vous répondrons à l’adresse indiquée dès que possible.",
  },
  noEmailFallback:
    "Le formulaire de contact n’est pas encore disponible. Réessayez plus tard ou consultez la FAQ en attendant.",
} as const;

export const PRIVACY_PAGE = {
  meta: {
    title: "Politique de confidentialité | Sebavia",
    description:
      "Consultez la politique de confidentialité de Sebavia et découvrez comment vos renseignements sont recueillis, utilisés et protégés.",
  },
  hero: {
    eyebrow: "Légal",
    title: "Politique de confidentialité",
    body: "Cette politique explique quels renseignements Sebavia recueille, pourquoi, et comment vous pouvez exercer vos droits. Elle s’applique aux utilisateurs du site et de l’application Sebavia accessibles sur sebavia.com.",
  },
  toc: [
    { id: "introduction", label: "Introduction" },
    { id: "renseignements", label: "Renseignements recueillis" },
    { id: "utilisation", label: "Utilisation des renseignements" },
    { id: "intelligence-artificielle", label: "Intelligence artificielle" },
    { id: "geolocalisation", label: "Géolocalisation" },
    { id: "paiements", label: "Paiements" },
    { id: "fournisseurs", label: "Fournisseurs de services" },
    { id: "temoins", label: "Témoins et technologies similaires" },
    { id: "conservation", label: "Conservation" },
    { id: "securite", label: "Sécurité" },
    { id: "droits", label: "Vos droits et demandes" },
    { id: "modifications", label: "Modifications" },
    { id: "contact-confidentialite", label: "Nous joindre" },
  ],
} as const;

export const TERMS_PAGE = {
  meta: {
    title: "Conditions d’utilisation | Sebavia",
    description:
      "Consultez les conditions encadrant l’utilisation de Sebavia, de ses outils de planification, de ses forfaits et de son assistant intelligent.",
  },
  hero: {
    eyebrow: "Légal",
    title: "Conditions d’utilisation",
    body: "Ces conditions encadrent l’accès et l’utilisation de Sebavia. En utilisant le service ou en créant un compte, vous acceptez ces conditions.",
  },
  toc: [
    { id: "acceptation", label: "Acceptation" },
    { id: "service", label: "Description du service" },
    { id: "voyageur", label: "Responsabilité du voyageur" },
    { id: "comptes", label: "Comptes" },
    { id: "utilisation-acceptable", label: "Utilisation acceptable" },
    { id: "contenu", label: "Contenu de l’utilisateur" },
    { id: "ia", label: "Intelligence artificielle" },
    { id: "forfaits", label: "Forfaits et paiements" },
    { id: "propriete", label: "Propriété intellectuelle" },
    { id: "disponibilite", label: "Disponibilité" },
    { id: "responsabilite", label: "Limitation de responsabilité" },
    { id: "suspension", label: "Suspension et fermeture" },
    { id: "modifications", label: "Modifications" },
    { id: "droit", label: "Droit applicable" },
    { id: "contact-conditions", label: "Contact" },
  ],
} as const;
