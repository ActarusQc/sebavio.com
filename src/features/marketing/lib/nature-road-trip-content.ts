/**
 * Contenu informatif du guide /guides/road-trip-nature-quebec.
 * Intention : organiser un road trip nature — sans liste de lieux ni manuel technique.
 */

export const NATURE_DAY_EXAMPLE = {
  title: "Exemple fictif d’un road trip nature",
  disclaimer:
    "Exemple fictif. Horaire à adapter. Aucun lieu, accès, prix ou horaire réel n’est recommandé.",
  scenario:
    "Scénario conceptuel sur deux journées : activité extérieure accessible, marge, météo revérifiée et solution de rechange.",
  blocks: [
    {
      time: "Première journée",
      title: "Départ, activité et hébergement",
      body: "Départ, pause, activité extérieure accessible, repas, moment libre ou activité courte, puis hébergement sans précipitation.",
    },
    {
      time: "Deuxième journée",
      title: "Activité principale et retour",
      body: "Météo revérifiée, activité principale, repas, retour — avec une solution de rechange si les conditions changent.",
    },
  ],
} as const;

export const NATURE_GUIDE = {
  meta: {
    title: "Road trip nature au Québec : guide pratique | Sebavia",
    description:
      "Préparez un road trip nature au Québec : activités, météo, accès, hébergement, carburant, plan de rechange et checklist avant le départ.",
  },
  hero: {
    eyebrow: "Guide · Nature",
    title: "Road trip nature au Québec : bien préparer son escapade",
    body: "Un voyage axé sur la nature demande de coordonner le trajet, les activités, la météo, les heures d’accès et un plan de rechange — sans surcharger la journée ni dépendre d’une seule activité extérieure.",
    primaryCta: {
      href: "/planificateur-road-trip-quebec",
      label: "Voir le planificateur",
    },
    secondaryCta: {
      href: "/meteo-voyage",
      label: "Consulter la météo du voyage",
    },
  },
  intro: {
    title: "Définir son idée de nature",
    paragraphs: [
      "Une escapade nature peut viser une promenade, l’observation, une plage, un jardin, une forêt, un paysage, un belvédère, une activité familiale, un pique-nique, un centre d’interprétation ou une activité extérieure saisonnière.",
      "Précisez d’abord le niveau d’effort souhaité, le temps disponible, la saison, le profil du groupe, le besoin d’hébergement et le temps de route maximal. Une activité physique intense n’est pas la norme.",
    ],
  },
  toc: [
    { id: "rythme", label: "Choisir un rythme réaliste" },
    { id: "groupe", label: "Adapter l’activité au groupe" },
    { id: "acces", label: "Vérifier l’accès avant de partir" },
    { id: "meteo", label: "La météo influence plus que les vêtements" },
    { id: "rechange", label: "Prévoir une activité de rechange" },
    { id: "repas", label: "Organiser les repas et pauses" },
    { id: "hebergement", label: "Hébergement et heure d’arrivée" },
    { id: "vehicule", label: "Préparer le véhicule" },
    { id: "carburant", label: "Carburant et secteurs moins desservis" },
    { id: "respect", label: "Respecter les lieux" },
    { id: "interets", label: "Combiner nature et autres intérêts" },
    { id: "budget", label: "Budget d’un voyage nature" },
    { id: "exemple", label: "Exemple fictif d’un road trip nature" },
    { id: "checklist-nature", label: "Checklist nature" },
    { id: "sebavia", label: "Comment Sebavia peut aider" },
    { id: "limites", label: "Limites de ce guide" },
  ],
  rythme: {
    id: "rythme",
    title: "Choisir un rythme réaliste",
    lead: "Une journée peut rapidement devenir trop chargée avec la conduite, le stationnement, l’accès, l’activité, les pauses, les repas, la météo et le retour.",
    formula:
      "Durée de la journée = trajet + accès + activité + pauses + repas + marge",
    tip: "Cette formule est une aide à la réflexion, pas une norme. Aucune durée universelle ne s’applique à tous les voyageurs.",
    link: {
      href: "/guides/escapade-fin-de-semaine-quebec",
      label: "Organiser aussi une courte fin de semaine",
    },
  },
  groupe: {
    id: "groupe",
    title: "Adapter l’activité au groupe",
    lead: "Vérifiez âge, mobilité, expérience, durée, niveau d’effort, terrain, accès, services, météo et saison — sans conseil technique de randonnée.",
    blocks: [
      {
        title: "Voyage solo",
        items: [
          "Activité connue",
          "Horaire partagé avec un proche, si vous le souhaitez",
          "Option de rechange",
          "Limites personnelles respectées",
        ],
        link: {
          href: "/guides/road-trip-solo-quebec",
          label: "Guide road trip solo",
        },
      },
      {
        title: "Voyage en couple",
        items: [
          "Activité choisie ensemble",
          "Rythme commun",
          "Temps libre",
          "Solution différente si les intérêts divergent",
        ],
        link: {
          href: "/guides/road-trip-couple-quebec",
          label: "Guide road trip en couple",
        },
      },
      {
        title: "Voyage familial",
        items: [
          "Durée plus courte",
          "Pauses",
          "Services accessibles",
          "Activité adaptée à l’âge",
          "Solution intérieure",
        ],
        link: {
          href: "/guides/road-trip-famille-quebec",
          label: "Guide road trip en famille",
        },
      },
    ],
  },
  acces: {
    id: "acces",
    title: "Vérifier l’accès avant de partir",
    lead: "L’accès peut dépendre de la saison, des heures, d’une réservation, du stationnement, de travaux, d’une fermeture temporaire, d’une limite de capacité, de la météo ou de règles locales.",
    tip: "Vérifiez auprès du gestionnaire ou de la source officielle. Sebavia ne garantit ni l’ouverture, ni le stationnement, ni l’accès, ni l’état du terrain, ni la disponibilité.",
  },
  meteo: {
    id: "meteo",
    title: "La météo influence plus que les vêtements",
    lead: "La météo peut influencer l’activité, l’heure de départ, la visibilité, l’accès, la durée, le confort, le trajet et le plan de rechange.",
    items: [
      "Les prévisions évoluent",
      "La météo ne remplace pas les conditions routières officielles",
      "Une activité peut devoir être reportée",
      "La décision finale appartient au voyageur",
    ],
    note: "Sebavia n’est pas une source d’alertes officielles.",
    link: {
      href: "/meteo-voyage",
      label: "Comment Sebavia présente la météo du voyage",
    },
  },
  rechange: {
    id: "rechange",
    title: "Prévoir une activité de rechange",
    lead: "Un plan de rechange conserve un voyage agréable — ce n’est pas un échec.",
    items: [
      "Activité intérieure",
      "Visite culturelle",
      "Repas",
      "Centre d’interprétation",
      "Promenade plus courte",
      "Moment libre",
      "Retour anticipé",
    ],
  },
  repas: {
    id: "repas",
    title: "Organiser les repas et pauses",
    lead: "Adaptez les repas au rythme de l’activité et aux règles du lieu.",
    items: [
      "Repas avant l’activité",
      "Pique-nique lorsque permis",
      "Collation",
      "Repas après l’activité",
      "Arrêt sur le trajet",
      "Eau",
      "Solution de rechange",
    ],
    tip: "Vérifiez les règles du lieu, les heures, la gestion des déchets et les services disponibles.",
    link: {
      href: "/guides/road-trip-gastronomique-quebec",
      label: "Préparer aussi une escapade gourmande",
    },
  },
  hebergement: {
    id: "hebergement",
    title: "Hébergement et heure d’arrivée",
    lead: "L’hébergement peut éviter un retour trop long après une journée complète.",
    items: [
      "Distance après l’activité",
      "Fatigue",
      "Heure d’arrivée",
      "Procédure d’accueil",
      "Stationnement",
      "Proximité du trajet du lendemain",
      "Météo",
      "Politique d’annulation",
    ],
    note: "Sebavia peut proposer ou intégrer un hébergement selon ses fonctions. La disponibilité reste à confirmer auprès du fournisseur.",
  },
  vehicule: {
    id: "vehicule",
    title: "Préparer le véhicule",
    lead: "Checklist générale — pas un diagnostic. Pour toute vérification mécanique, consultez un professionnel qualifié.",
    items: [
      "Niveau de carburant",
      "Consommation configurée",
      "Pneus (contrôle visuel simple)",
      "Éclairage",
      "Lave-glace",
      "Chargeurs",
      "Vêtements adaptés",
      "Eau",
      "Documents",
      "Espace pour les bagages",
      "Trousse générale",
    ],
  },
  carburant: {
    id: "carburant",
    title: "Carburant et secteurs moins desservis",
    lead: "Certaines excursions peuvent comprendre de longues portions, moins de services, un détour, un aller-retour différent ou plusieurs activités.",
    items: [
      "Conserver une marge",
      "Confirmer les stations",
      "Ne pas attendre une autonomie minimale",
      "Tenir compte du retour",
    ],
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
  respect: {
    id: "respect",
    title: "Respecter les lieux",
    lead: "Quelques comportements généraux — sans règle légale précise.",
    items: [
      "Respecter les règles",
      "Utiliser les accès autorisés",
      "Rapporter ses déchets",
      "Ne pas déranger la faune",
      "Respecter les fermetures",
      "Demeurer dans les secteurs permis",
      "Suivre les instructions du gestionnaire",
    ],
  },
  interets: {
    id: "interets",
    title: "Combiner nature et autres intérêts",
    lead: "Sebavia peut utiliser plusieurs intérêts lorsque cette capacité est disponible.",
    items: [
      "Nature et gastronomie",
      "Nature et culture",
      "Nature et famille",
      "Nature et détente",
      "Nature et photographie",
      "Nature et court séjour",
    ],
    links: [
      {
        href: "/guides/road-trip-gastronomique-quebec",
        label: "Guide gastronomique",
      },
      {
        href: "/guides/road-trip-famille-quebec",
        label: "Guide famille",
      },
      {
        href: "/guides/escapade-fin-de-semaine-quebec",
        label: "Guide court séjour",
      },
      {
        href: "/guides/road-trip-solo-quebec",
        label: "Guide solo",
      },
    ],
  },
  budget: {
    id: "budget",
    title: "Budget d’un voyage nature",
    lead: "Un voyage nature n’impose pas d’acheter de l’équipement spécialisé pour être réussi.",
    items: [
      "Carburant",
      "Hébergement",
      "Stationnement",
      "Droit d’accès",
      "Activité",
      "Repas",
      "Équipement déjà possédé ou requis",
      "Marge",
      "Détour",
    ],
    link: {
      href: "/guides/budget-road-trip-quebec",
      label: "Préparer le budget global du road trip",
    },
  },
  checklist: {
    id: "checklist-nature",
    title: "Checklist nature",
    lead: "Liste imprimable — à adapter selon la durée du séjour.",
    groups: [
      {
        title: "Avant de choisir",
        items: [
          "Dates",
          "Temps de route maximal",
          "Type d’activité",
          "Niveau d’effort",
          "Profil du groupe",
          "Saison",
          "Budget",
          "Besoin d’hébergement",
        ],
      },
      {
        title: "Avant de confirmer",
        items: [
          "Accès",
          "Heures",
          "Stationnement",
          "Réservation",
          "Règles",
          "Météo",
          "Activité de rechange",
          "Hébergement",
          "Trajet de retour",
        ],
      },
      {
        title: "Avant de partir",
        items: [
          "Météo revérifiée",
          "Conditions routières officielles lorsque nécessaire",
          "Carburant",
          "Véhicule",
          "Vêtements",
          "Eau",
          "Repas",
          "Confirmations",
          "Téléphone chargé",
          "Heure de retour communiquée lorsque pertinent",
        ],
      },
    ],
  },
  sebavia: {
    id: "sebavia",
    title: "Comment Sebavia peut aider",
    lead: "Sebavia peut aider à organiser une escapade nature. Ce n’est ni une source officielle d’accès, ni un juge de la difficulté ou de la sécurité d’une activité.",
    links: [
      {
        href: "/assistant-voyage-ia",
        label: "Assistant voyage",
        body: "Préciser l’intérêt nature et ajuster le parcours en conversation.",
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
      "Les accès peuvent changer, les prévisions évoluent et les activités peuvent être saisonnières. Les capacités personnelles varient.",
      "Confirmez les informations auprès des sources officielles. Ce guide ne couvre pas toutes les situations.",
    ],
  },
  printNote:
    "Astuce : utilisez la fonction d’impression de votre navigateur pour emporter la checklist et l’exemple fictif.",
  finalCta: {
    title: "Transformez votre idée d’escapade nature en voyage organisé",
    body: "Sebavia peut aider à réunir dates, trajet, activités, météo, hébergement et carburant.",
    primary: {
      href: "/register",
      label: "Planifier mon escapade nature",
    },
    secondary: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrir le planificateur",
    },
    guidesLink: { href: "/guides", label: "Retour aux guides" },
  },
} as const;
