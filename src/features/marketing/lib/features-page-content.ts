/**
 * Contenu public de /fonctionnalites — uniquement des capacités confirmées.
 * Ne pas y placer de montants (source : /pricing).
 */

import { BRAND_ASSETS } from "./brand-assets";
import { PRICING_PAGE } from "./pricing-content";

export const FEATURES_PAGE = {
  meta: {
    title: "Fonctionnalités Sebavia | Planificateur de voyages routiers",
    description:
      "Découvrez les fonctionnalités de Sebavia : assistant intelligent, itinéraires personnalisés, activités, météo et estimation du carburant.",
  },
  hero: {
    eyebrow: "Fonctionnalités",
    title: "Tout ce qu’il faut pour planifier votre voyage routier",
    body: "Sebavia réunit l’itinéraire, les activités, la météo, le carburant et un assistant intelligent dans un même espace, pour préparer un voyage routier plus simplement et selon vos préférences.",
    primaryCta: { href: "/register", label: "Créer mon voyage" },
    secondaryCta: { href: "/pricing", label: "Voir les forfaits" },
    image: {
      src: BRAND_ASSETS.heroLandscapeWebp,
      alt: "Route nocturne sous un ciel étoilé — ambiance de voyage Sebavia",
      width: 1200,
      height: 675,
    },
  },
  categories: [
    {
      id: "assistant",
      title: "Assistant intelligent",
      summary: "Planifiez en conversation, à l’écrit ou à la voix.",
    },
    {
      id: "itineraire",
      title: "Itinéraire et détours",
      summary: "Carte, étapes, pauses et parcours adaptable.",
    },
    {
      id: "activites",
      title: "Activités et découvertes",
      summary: "Suggestions, restaurants et hébergements utiles.",
    },
    {
      id: "meteo",
      title: "Météo du voyage",
      summary: "Prévisions pour mieux préparer votre départ.",
    },
    {
      id: "carburant",
      title: "Carburant et ravitaillement",
      summary: "Estimation des coûts et arrêts possibles.",
    },
    {
      id: "personnalisation",
      title: "Organisation personnalisée",
      summary: "Solo, couple ou famille : adaptez le rythme.",
    },
  ],
  assistant: {
    title: "Un assistant qui comprend votre voyage",
    lead: "Décrivez ce que vous cherchez en langage naturel. Sebavia peut vous aider à démarrer un voyage, préciser une destination, ajuster une durée de trajet, choisir des intérêts ou modifier un parcours déjà créé.",
    examples: [
      "Je cherche une sortie romantique à moins de trois heures de route.",
      "Ajoute un arrêt pour dîner vers midi.",
      "Trouve une activité familiale sur le trajet.",
      "Ajoute un détour par cette région.",
    ],
    capabilities: [
      "Créer un voyage à partir d’une conversation",
      "Préciser destination, durée et style de voyage",
      "Ajouter des activités ou une pause",
      "Proposer un hébergement dans le flux de planification",
      "Adapter un voyage déjà enregistré",
      "Utiliser la conversation écrite ou la voix (selon forfait)",
    ],
    note: "Les propositions (horaires, disponibilités, lieux) peuvent évoluer : vérifiez toujours les renseignements importants avant de partir.",
    moreLink: {
      href: "/assistant-voyage-ia",
      label: "Découvrir l’assistant voyage IA",
    },
  },
  itinerary: {
    title: "Un itinéraire que vous pouvez adapter",
    lead: "Sebavia calcule un trajet avec distance, durée estimée et carte. Vous pouvez ajouter des étapes, des pauses ou des détours, puis laisser l’itinéraire se recalculer.",
    items: [
      "Calcul d’itinéraire avec distance et durée",
      "Carte du parcours et ordre des étapes",
      "Pauses et détours sur le trajet",
      "Heure de départ et durée estimée",
      "Recalcul après modification",
    ],
    note: "Sebavia aide à organiser le trajet ; les conditions routières réelles peuvent changer. Consultez aussi les avis officiels avant de prendre la route.",
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Planifier un road trip au Québec",
    },
    guidesLink: {
      href: "/guides/checklist-road-trip-quebec",
      label: "Checklist : préparer un road trip au Québec",
    },
    faqLink: { href: "/faq", label: "Questions fréquentes sur les voyages" },
  },
  activities: {
    title: "Activités, restaurants et hébergements",
    lead: "Enrichissez votre trajet avec des suggestions adaptées à vos intérêts et au type de voyage. Ajoutez une activité, estimez sa durée et voyez l’impact sur le parcours.",
    items: [
      "Suggestions d’activités selon le profil du voyage",
      "Ajout au voyage avec durée estimée",
      "Recherche d’un restaurant ou d’un arrêt utile",
      "Proposition d’hébergement dans la planification assistée",
    ],
    note: "Les disponibilités, horaires et tarifs des établissements doivent être confirmés auprès des lieux concernés. Sebavia ne gère pas la réservation directe.",
  },
  weather: {
    title: "La météo pour mieux préparer le départ",
    lead: "Consultez les prévisions liées à votre voyage — au départ, à destination et autour des dates prévues — pour anticiper vêtements, pauses et rythme de route.",
    items: [
      "Prévisions autour des dates du voyage",
      "Distinction entre les lieux du trajet",
      "Aide concrète pour savoir quoi prévoir",
    ],
    note: "Les prévisions météo évoluent : revérifiez-les à l’approche du départ.",
    weatherPageLink: {
      href: "/meteo-voyage",
      label: "Découvrir la météo intégrée au voyage",
    },
  },
  fuel: {
    title: "Carburant et arrêts de ravitaillement",
    lead: "À partir de votre véhicule et de votre parcours, Sebavia estime la consommation, le coût du voyage et les achats nécessaires. Vous pouvez aussi préparer des arrêts de ravitaillement.",
    items: [
      "Estimation de consommation selon le véhicule",
      "Coût estimé du trajet (aller et, au besoin, retour)",
      "Prise en compte du réservoir et du type de carburant",
      "Suggestion d’arrêts de ravitaillement",
      "Recalcul après ajout d’activités ou de détours",
    ],
    example:
      "Exemple : un trajet de fin de semaine avec un détour d’activité — Sebavia met à jour la distance, le carburant estimé et les arrêts possibles.",
    note: "Le plein initial peut être traité séparément. Les prix et disponibilités des stations varient : les estimations ne sont pas des garanties, et les arrêts doivent être confirmés pendant le voyage.",
    costCalculatorLink: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Estimer le coût du carburant",
    },
    stopsPlannerLink: {
      href: "/planifier-arrets-carburant",
      label: "Planifier les arrêts de ravitaillement",
    },
  },
  personalization: {
    title: "Un même trajet, plusieurs façons de voyager",
    lead: "Solo, en couple ou en famille : précisez le nombre d’adultes et d’enfants, vos intérêts et le rythme souhaité. Sebavia s’en sert pour orienter activités et organisation.",
    items: [
      "Profils solo, couple, famille (et autres contextes utiles)",
      "Nombre d’adultes et d’enfants",
      "Intérêts et style de sortie",
      "Distance ou durée maximale de déplacement",
      "Véhicule enregistré pour les calculs de carburant",
    ],
  },
  howItWorks: {
    title: "Comment ça fonctionne",
    steps: [
      {
        title: "Décrivez votre voyage",
        body: "Indiquez votre point de départ, vos envies ou votre destination — manuellement ou en conversation avec l’assistant.",
      },
      {
        title: "Personnalisez l’itinéraire",
        body: "Ajustez étapes, pauses, détours et heure de départ pour coller à votre rythme.",
      },
      {
        title: "Ajoutez activités et arrêts",
        body: "Complétez avec des activités, un repas, un hébergement proposé ou des arrêts carburant.",
      },
      {
        title: "Consultez tout au même endroit",
        body: "Carte, météo, carburant et détails du voyage restent réunis dans votre espace Sebavia.",
      },
    ],
  },
  useCases: [
    {
      id: "weekend",
      title: "Escapade de fin de semaine",
      body: "Durée maximale, destination adaptée, activités, hébergement proposé et météo pour préparer deux ou trois jours hors de chez vous.",
    },
    {
      id: "famille",
      title: "Voyage familial",
      body: "Pauses plus fréquentes, activités pour enfants, rythme souple et arrêts de carburant anticipés.",
    },
    {
      id: "roadtrip",
      title: "Long road trip",
      body: "Étapes, détours, estimation du carburant, météo et organisation des journées dans un seul parcours.",
    },
    {
      id: "couple",
      title: "Sortie en couple",
      body: "Restaurant, activité et ambiance recherchée, avec un itinéraire ajusté à une escapade à deux.",
    },
  ],
  plans: {
    title: "Des fonctions selon votre forfait",
    lead: "Certaines capacités avancées (assistant complet, voix, accès détaillé au voyage, optimisation du carburant) dépendent du forfait. Les prix et inclusions officiels sont sur la page Tarifs.",
    items: [
      {
        name: "Découverte",
        body: `${PRICING_PAGE.plans.decouverte.subtitle} Accès d’aperçu limité.`,
      },
      {
        name: "Pass 30 jours",
        body: `${PRICING_PAGE.plans.pass.subtitle} Accès complet pendant 30 jours, sans renouvellement automatique.`,
      },
      {
        name: "Sebavia Plus",
        body: `${PRICING_PAGE.plans.plus.subtitle} Abonnement avec les fonctions incluses selon le catalogue actif.`,
      },
    ],
    cta: { href: "/pricing", label: "Comparer les forfaits" },
  },
  finalCta: {
    title: "Prêt à préparer votre prochain voyage ?",
    body: "Créez un compte pour commencer, ou consultez les forfaits pour choisir l’accès qui vous convient.",
    primary: { href: "/register", label: "Créer mon compte" },
    secondary: { href: "/pricing", label: "Consulter les tarifs" },
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
} as const;
