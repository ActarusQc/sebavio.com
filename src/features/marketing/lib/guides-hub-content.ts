import { getPublishedGuides, type GuideMeta } from "./guides-registry";

export const GUIDES_HUB = {
  meta: {
    title: "Guides de voyage routier | Sebavia",
    description:
      "Guides pratiques pour préparer vos road trips au Québec : checklists, conseils de préparation et liens vers les outils Sebavia.",
  },
  hero: {
    eyebrow: "Centre de guides",
    title: "Guides pour préparer vos voyages routiers",
    body: "Les guides Sebavia présentent des conseils concrets pour organiser un road trip : ce qu’il faut vérifier, préparer et anticiper avant de prendre la route — sans remplacer les sources officielles.",
    primaryCta: {
      href: "/guides/road-trip-famille-quebec",
      label: "Lire le guide famille",
    },
    secondaryCta: {
      href: "/guides/checklist-road-trip-quebec",
      label: "Voir la checklist",
    },
  },
  intro: {
    title: "Des ressources utiles, pas des pages publicitaires",
    body: "Ce centre regroupe des contenus informatifs pour vous aider à préparer un voyage en voiture — checklist avant le départ, budget global, voyage en famille, et d’autres guides à venir. Chaque guide reste distinct des pages qui présentent les outils Sebavia : ici, l’objectif est de répondre à une question pratique, pas de vendre une fonction.",
  },
  howToUse: {
    title: "Comment utiliser ces guides",
    items: [
      "Parcourez la checklist qui correspond à votre étape de préparation.",
      "Cochez mentalement ou imprimez ce qui vous est utile.",
      "Suivez les liens vers Sebavia seulement lorsque vous voulez passer à l’action dans l’outil.",
      "Revérifiez toujours les informations qui changent (météo, routes, horaires) près du départ.",
    ],
  },
  disclaimer: {
    title: "À garder en tête",
    body: "Ces guides sont des aides à la préparation. Ils ne couvrent pas toutes les situations, ne constituent pas un conseil mécanique, juridique ou de sécurité, et ne remplacent pas les avis officiels ni l’entretien professionnel de votre véhicule.",
  },
  empty: {
    title: "Aucun guide publié pour le moment",
    body: "Revenez bientôt — ou explorez les fonctionnalités de Sebavia pour commencer à organiser un voyage.",
  },
  finalCta: {
    title: "Prêt à structurer votre voyage?",
    body: "Une fois la préparation claire, Sebavia vous aide à rassembler itinéraire, carburant et météo dans un même parcours.",
    primary: { href: "/register", label: "Créer un compte" },
    secondary: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrir le planificateur",
    },
  },
} as const;

export function listHubGuides(): GuideMeta[] {
  return getPublishedGuides();
}
