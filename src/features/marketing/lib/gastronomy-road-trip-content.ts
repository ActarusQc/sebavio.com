/**
 * Contenu informatif du guide /guides/road-trip-gastronomique-quebec.
 * Intention : organiser une escapade gourmande — sans liste de commerces ni parcours de dégustation.
 */

export const GASTRONOMY_DAY_EXAMPLE = {
  title: "Exemple d’escapade gourmande",
  disclaimer:
    "Exemple fictif. Horaire à adapter. Aucun commerce, prix, horaire ou lieu réel n’est recommandé.",
  scenario:
    "Scénario fictif sur deux journées conceptuelles : départ, repas principal, découverte locale et retour avec marge.",
  blocks: [
    {
      time: "Première journée",
      title: "Départ, pause et repas principal",
      body: "Départ selon l’heure disponible, pause gourmande simple, une activité, un repas principal, puis hébergement sans précipitation.",
    },
    {
      time: "Deuxième journée",
      title: "Découverte locale et retour",
      body: "Déjeuner, visite générique d’un marché ou producteur, activité, repas simple et retour avec une marge avant les obligations.",
    },
  ],
} as const;

export const GASTRONOMY_GUIDE = {
  meta: {
    title: "Road trip gastronomique au Québec : guide gourmand | Sebavia",
    description:
      "Organisez une escapade gourmande au Québec : restaurants, marchés, activités, hébergement, budget, météo et étapes du voyage routier.",
  },
  hero: {
    eyebrow: "Guide · Gastronomie",
    title:
      "Road trip gastronomique au Québec : organiser une escapade gourmande",
    body: "Une escapade gourmande réussie coordonne repas, visites, horaires et trajet — sans transformer toute la journée en suite de déplacements.",
    primaryCta: {
      href: "/assistant-voyage-ia",
      label: "Découvrir l’assistant",
    },
    secondaryCta: {
      href: "/planificateur-road-trip-quebec",
      label: "Voir le planificateur",
    },
  },
  intro: {
    title: "Définir le type d’expérience gourmande",
    paragraphs: [
      "Une escapade gastronomique peut viser une cuisine régionale, un repas principal, un marché, un producteur alimentaire, une boulangerie, une fromagerie, un café, une activité culinaire, ou un mélange avec nature et culture.",
      "Commencez par préciser ce que vous recherchez vraiment — plutôt qu’empiler tous les arrêts possibles. Ce guide aide à construire une sortie gourmande réaliste, sans liste de commerces.",
    ],
  },
  toc: [
    { id: "priorite", label: "Choisir une priorité gourmande" },
    { id: "conduite", label: "Définir le temps de conduite maximal" },
    { id: "repas-itineraire", label: "Placer les repas dans l’itinéraire" },
    {
      id: "trajet-destination",
      label: "Restaurant sur la route ou à destination",
    },
    { id: "marches", label: "Marchés, producteurs et boutiques gourmandes" },
    { id: "interets", label: "Combiner gastronomie et autres intérêts" },
    { id: "horaire", label: "Ne pas surcharger la journée" },
    { id: "reservations", label: "Réservations, horaires et disponibilité" },
    { id: "allergens", label: "Restrictions alimentaires et allergènes" },
    { id: "hebergement", label: "Choisir l’hébergement" },
    { id: "budget", label: "Budget d’une escapade gourmande" },
    { id: "carburant", label: "Carburant et détours" },
    { id: "meteo", label: "Météo et solution de rechange" },
    { id: "exemple", label: "Exemple d’escapade gourmande" },
    { id: "checklist-gastro", label: "Checklist escapade gourmande" },
    { id: "sebavia", label: "Comment Sebavia peut aider" },
    { id: "limites", label: "Limites de ce guide" },
  ],
  priorite: {
    id: "priorite",
    title: "Choisir une priorité gourmande",
    lead: "Une courte escapade devient vite surchargée si chaque repas et chaque arrêt devient obligatoire. Choisissez une priorité — sans règle universelle.",
    approaches: [
      {
        title: "Un repas principal",
        items: [
          "Un restaurant ou repas prioritaire",
          "Activités organisées autour de ce moment",
          "Marge pour le déplacement",
        ],
      },
      {
        title: "Plusieurs petites découvertes",
        items: [
          "Marché",
          "Boulangerie",
          "Boutique",
          "Producteur",
          "Repas plus simple",
        ],
      },
      {
        title: "Une activité culinaire",
        items: [
          "Atelier",
          "Visite",
          "Événement",
          "Découverte de produits",
          "Expérience à confirmer",
        ],
      },
    ],
  },
  conduite: {
    id: "conduite",
    title: "Définir le temps de conduite maximal",
    lead: "Plus le temps de route augmente, moins il reste de temps pour profiter des découvertes gourmandes.",
    items: [
      "Temps disponible",
      "Heures des repas",
      "Réservations éventuelles",
      "Activités",
      "Installation à l’hébergement",
      "Retour",
    ],
    tip: "Choisissez d’abord une durée maximale réaliste, puis organisez les repas autour de ce cadre.",
    link: {
      href: "/guides/escapade-fin-de-semaine-quebec",
      label: "Organiser aussi une courte fin de semaine",
    },
  },
  repasItineraire: {
    id: "repas-itineraire",
    title: "Placer les repas dans l’itinéraire",
    lead: "Un repas peut être placé selon l’heure de départ, la position approximative à midi ou au souper, la destination, une activité, l’hébergement ou le retour.",
    risks: [
      "Détour important",
      "Arrivée tardive",
      "Repas trop tôt ou trop tard",
      "Activité écourtée",
      "Retour précipité",
    ],
    tip: "Sebavia peut aider à chercher un repas autour d’une heure ou d’un secteur selon les fonctions disponibles — sans précision garantie à la minute.",
    link: {
      href: "/assistant-voyage-ia",
      label: "Structurer les repas avec l’assistant",
    },
  },
  trajetDestination: {
    id: "trajet-destination",
    title: "Restaurant sur la route ou à destination",
    lead: "Aucune approche n’est toujours supérieure : cela dépend du trajet et du rythme souhaité.",
    route: {
      title: "Repas sur le trajet",
      items: [
        "Peut diviser la route",
        "Peut servir de pause",
        "Peut éviter d’arriver affamé",
        "Peut créer un détour",
      ],
    },
    destination: {
      title: "Repas à destination",
      items: [
        "Peut simplifier le trajet",
        "Peut prolonger l’expérience sur place",
        "Peut dépendre de l’heure d’arrivée",
        "Peut nécessiter une réservation",
      ],
    },
  },
  marches: {
    id: "marches",
    title: "Marchés, producteurs et boutiques gourmandes",
    lead: "Des catégories génériques — à confirmer localement, sans commerce nommé.",
    categories: [
      "Marché public",
      "Boulangerie",
      "Pâtisserie",
      "Fromagerie",
      "Chocolaterie",
      "Café",
      "Producteur",
      "Ferme",
      "Boutique de produits régionaux",
      "Événement alimentaire",
    ],
    checks: [
      "Heures",
      "Jours d’ouverture",
      "Saison",
      "Accès",
      "Réservation éventuelle",
      "Moyens de paiement",
      "Règles de visite",
    ],
    tip: "Sebavia ne couvre pas tous les producteurs ni tous les commerces.",
  },
  interets: {
    id: "interets",
    title: "Combiner gastronomie et autres intérêts",
    lead: "Plusieurs intérêts peuvent être combinés lorsque le produit le permet.",
    items: [
      "Gastronomie et nature",
      "Gastronomie et culture",
      "Gastronomie et magasinage",
      "Gastronomie et détente",
      "Gastronomie et activité familiale",
      "Gastronomie et escapade en couple",
    ],
    links: [
      {
        href: "/guides/road-trip-nature-quebec",
        label: "Guide road trip nature",
      },
      {
        href: "/guides/road-trip-couple-quebec",
        label: "Guide road trip en couple",
      },
      {
        href: "/guides/road-trip-famille-quebec",
        label: "Guide road trip en famille",
      },
      {
        href: "/guides/road-trip-solo-quebec",
        label: "Guide road trip solo",
      },
    ],
  },
  horaire: {
    id: "horaire",
    title: "Ne pas surcharger la journée",
    lead: "Une succession de repas, visites et détours peut réduire le plaisir du voyage.",
    structure: [
      "Une expérience gourmande prioritaire",
      "Une activité principale",
      "Un moment libre",
      "Une solution de rechange",
    ],
    tip: "Évitez de multiplier les repas uniquement pour remplir l’itinéraire.",
  },
  reservations: {
    id: "reservations",
    title: "Réservations, horaires et disponibilité",
    lead: "Les informations utiles évoluent : confirmez toujours avant de partir.",
    items: [
      "Les heures changent",
      "Certains lieux ouvrent seulement certains jours",
      "La saison influence l’offre",
      "Une réservation peut être nécessaire",
      "Une activité peut être complète",
      "Menus et prix changent",
      "Politiques d’annulation variables",
    ],
    note: "Sebavia peut aider à organiser le voyage, mais ne réserve pas directement et ne garantit ni horaires, ni prix, ni disponibilité.",
    link: {
      href: "/conditions-utilisation",
      label: "Conditions d’utilisation",
    },
  },
  allergens: {
    id: "allergens",
    title: "Restrictions alimentaires et allergènes",
    lead: "Les besoins particuliers doivent être vérifiés directement auprès de l’établissement.",
    items: [
      "Allergies",
      "Intolérances",
      "Alimentation végétarienne",
      "Alimentation végétalienne",
      "Autres restrictions",
    ],
    tip: "Pour une allergie ou une restriction importante, communiquez directement avec l’établissement avant la visite. Sebavia ne valide ni les ingrédients, ni la contamination croisée, ni la sécurité d’un repas.",
  },
  hebergement: {
    id: "hebergement",
    title: "Choisir l’hébergement",
    lead: "L’hébergement peut réduire la conduite après une longue journée gourmande.",
    items: [
      "Proximité du dernier repas ou de la dernière activité",
      "Heure d’arrivée",
      "Stationnement",
      "Procédure d’arrivée",
      "Déjeuner éventuel",
      "Proximité du trajet de retour",
      "Politique d’annulation",
      "Services recherchés",
    ],
    note: "Sebavia peut proposer ou intégrer un hébergement selon ses fonctions. La réservation reste à confirmer auprès du fournisseur.",
  },
  budget: {
    id: "budget",
    title: "Budget d’une escapade gourmande",
    lead: "Une escapade gourmande n’est pas nécessairement coûteuse : pique-nique, marché et repas principal offrent une expérience différente d’un séjour composé uniquement de restaurants.",
    items: [
      "Carburant",
      "Hébergement",
      "Repas principal",
      "Collations",
      "Activités",
      "Achats de produits locaux",
      "Stationnement",
      "Frais possibles",
      "Marge",
    ],
    link: {
      href: "/guides/budget-road-trip-quebec",
      label: "Préparer le budget global du road trip",
    },
  },
  carburant: {
    id: "carburant",
    title: "Carburant et détours",
    lead: "Plusieurs petits arrêts peuvent modifier la distance totale, la consommation, l’heure d’arrivée, l’autonomie et le besoin de ravitaillement.",
    links: [
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Estimer le coût de carburant",
      },
      {
        href: "/planifier-arrets-carburant",
        label: "Planifier les arrêts de carburant",
      },
    ],
  },
  meteo: {
    id: "meteo",
    title: "Météo et solution de rechange",
    lead: "La météo peut influencer un marché extérieur, une terrasse, une visite de ferme, un pique-nique, une activité intérieure, l’heure de départ, la tenue et le trajet.",
    items: [
      "Prévisions autour des dates",
      "Option intérieure générique",
      "Revérification avant le départ",
      "Conditions routières officielles lorsque pertinent",
    ],
    note: "La météo doit être revérifiée et ne remplace pas les conditions routières officielles.",
    link: {
      href: "/meteo-voyage",
      label: "Comment Sebavia présente la météo du voyage",
    },
  },
  checklist: {
    id: "checklist-gastro",
    title: "Checklist escapade gourmande",
    lead: "Liste imprimable — à adapter selon la durée du séjour.",
    groups: [
      {
        title: "Avant de choisir la destination",
        items: [
          "Dates",
          "Temps de conduite maximal",
          "Type d’expérience",
          "Repas prioritaire",
          "Autres intérêts",
          "Budget",
          "Besoin d’hébergement",
        ],
      },
      {
        title: "Avant de réserver",
        items: [
          "Horaires confirmés",
          "Réservation",
          "Restrictions alimentaires",
          "Politique d’annulation",
          "Trajet",
          "Stationnement",
          "Hébergement",
          "Solution de rechange",
        ],
      },
      {
        title: "Avant de partir",
        items: [
          "Météo",
          "Conditions routières lorsque nécessaire",
          "Carburant",
          "Heures revérifiées",
          "Confirmations",
          "Moyen de paiement",
          "Sacs ou contenant approprié pour les achats",
          "Retour",
          "Marge dans l’horaire",
        ],
      },
    ],
  },
  sebavia: {
    id: "sebavia",
    title: "Comment Sebavia peut aider",
    lead: "Sebavia peut aider à organiser une sortie gastronomique. Ce n’est ni un service de réservation ni un classement de restaurants.",
    links: [
      {
        href: "/assistant-voyage-ia",
        label: "Assistant voyage",
        body: "Préciser la gastronomie, les repas et ajuster le parcours en conversation.",
      },
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur",
        body: "Structurer dates, trajet, activités et rythme.",
      },
      {
        href: "/fonctionnalites",
        label: "Fonctionnalités",
        body: "Intérêts, profils et organisation globale.",
      },
      {
        href: "/meteo-voyage",
        label: "Météo du voyage",
        body: "Prévisions liées aux dates et lieux.",
      },
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Carburant",
        body: "Estimer la part essence du budget.",
      },
      {
        href: "/planifier-arrets-carburant",
        label: "Arrêts de carburant",
        body: "Anticiper l’autonomie et les arrêts.",
      },
      {
        href: "/pricing",
        label: "Tarifs",
        body: "Comprendre les forfaits disponibles.",
      },
    ],
  },
  limits: {
    id: "limites",
    title: "Limites de ce guide",
    paragraphs: [
      "Horaires, menus, prix et disponibilités changent. Certaines activités sont saisonnières. Les besoins alimentaires doivent être confirmés auprès des établissements.",
      "Ces conseils demeurent généraux et ne couvrent pas toutes les situations.",
    ],
  },
  printNote:
    "Astuce : utilisez la fonction d’impression de votre navigateur pour emporter la checklist et l’exemple fictif.",
  finalCta: {
    title: "Transformez votre prochaine sortie gourmande en voyage organisé",
    body: "Sebavia peut aider à réunir dates, trajet, repas, activités, météo, hébergement et carburant.",
    primary: {
      href: "/register",
      label: "Planifier mon escapade gourmande",
    },
    secondary: {
      href: "/assistant-voyage-ia",
      label: "Découvrir l’assistant",
    },
    guidesLink: { href: "/guides", label: "Retour aux guides" },
  },
} as const;
