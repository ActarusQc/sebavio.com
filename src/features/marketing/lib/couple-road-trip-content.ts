/**
 * Contenu informatif du guide /guides/road-trip-couple-quebec.
 * Intention : organiser un road trip / escapade à deux — distinct famille, budget, checklist, planificateur.
 */

export const COUPLE_DAY_EXAMPLE = {
  title: "Exemple d’escapade",
  disclaimer:
    "Horaire fictif à adapter à votre rythme. Aucun lieu, commerce, distance ni prix réel n’est recommandé ici.",
  scenario:
    "Scénario fictif pour illustrer une fin de semaine à deux : une journée avec route raisonnable, une activité, un repas et du temps libre.",
  blocks: [
    {
      time: "Matin",
      title: "Départ et première portion de route",
      body: "Départ après le déjeuner, conduite dans la limite choisie ensemble, avec une pause courte si besoin.",
    },
    {
      time: "Midi",
      title: "Repas et moment libre",
      body: "Repas planifié ou improvisé selon l’énergie du jour, sans enchaîner trop vite vers l’activité suivante.",
    },
    {
      time: "Après-midi",
      title: "Activité commune et retour vers l’hébergement",
      body: "Une activité choisie à deux, puis une portion de route plus courte pour arriver sans précipitation.",
    },
    {
      time: "Soirée",
      title: "Installation et météo du lendemain",
      body: "Installation, repas du soir et coup d’œil aux prévisions — sans horaire garanti ni lieu nommé.",
    },
  ],
} as const;

export const COUPLE_GUIDE = {
  meta: {
    title: "Road trip en couple au Québec : guide pratique | Sebavia",
    description:
      "Organisez votre road trip ou escapade en couple au Québec : rythme, activités, repas, hébergement, météo, budget et checklist avant le départ.",
  },
  hero: {
    eyebrow: "Guide · Couple",
    title: "Road trip en couple au Québec : bien organiser l’escapade",
    body: "Une escapade à deux réussit souvent grâce au rythme, aux activités communes, aux repas et à un horaire qui laisse de la place à l’imprévu — pas seulement grâce à la destination.",
    primaryCta: {
      href: "/planificateur-road-trip-quebec",
      label: "Voir le planificateur",
    },
    secondaryCta: {
      href: "/assistant-voyage-ia",
      label: "Découvrir l’assistant",
    },
  },
  intro: {
    title: "Partir à deux, avec un cadre clair",
    paragraphs: [
      "Un voyage en couple peut durer une journée, une fin de semaine ou plusieurs jours. Ce qui change surtout, c’est le style recherché : nature, gastronomie, culture, détente ou mélange.",
      "Avant de charger l’itinéraire, alignez vos envies, le temps de conduite maximal et le niveau de spontanéité souhaité. Il n’y a pas une seule bonne façon de voyager à deux.",
    ],
  },
  toc: [
    { id: "style", label: "Choisir le style de l’escapade" },
    { id: "cadre", label: "Poser un cadre réaliste" },
    { id: "rythme", label: "Trouver un rythme à deux" },
    { id: "activites", label: "Choisir des activités communes" },
    { id: "repas", label: "Repas et moments gourmands" },
    { id: "hebergement", label: "Hébergement et arrivée" },
    { id: "temps-libre", label: "Garder du temps libre" },
    { id: "meteo", label: "Météo et plan de rechange" },
    { id: "carburant", label: "Carburant et pauses" },
    { id: "budget", label: "Budget à deux" },
    { id: "exemple", label: "Exemple d’escapade" },
    { id: "decisions", label: "Décider ensemble" },
    { id: "checklist-couple", label: "Checklist avant le départ" },
    { id: "sebavia", label: "Comment Sebavia peut aider" },
    { id: "limites", label: "Limites de ce guide" },
  ],
  style: {
    id: "style",
    title: "Choisir le style de l’escapade",
    lead: "Clarifiez d’abord ce que vous voulez vraiment vivre — sans présumer d’un seul modèle de voyage.",
    items: [
      "Escapade courte (une journée ou une nuit)",
      "Fin de semaine avec une ou deux nuitées",
      "Road trip de plusieurs jours",
      "Accent nature, culture, gastronomie ou détente",
      "Mélange d’activités et de moments calmes",
    ],
    tip: "Deux personnes n’ont pas toujours le même rythme : nommer le style recherché évite de surcharger l’horaire par défaut.",
  },
  cadre: {
    id: "cadre",
    title: "Poser un cadre réaliste",
    lead: "Quelques questions avant de choisir la destination ou les étapes.",
    items: [
      "Combien de jours sont disponibles",
      "Quelle durée maximale de conduite convient à vous deux",
      "Destination connue ou encore ouverte",
      "Aller-retour ou circuit",
      "Besoin d’hébergement ou non",
      "Intérêts partagés et intérêts individuels",
      "Budget approximatif",
      "Saison et météo probable",
      "Véhicule utilisé",
    ],
    tip: "Une durée de route plus courte laisse souvent plus de place aux repas, aux activités et aux pauses.",
    link: {
      href: "/planificateur-road-trip-quebec",
      label: "Structurer le cadre dans le planificateur",
    },
  },
  rythme: {
    id: "rythme",
    title: "Trouver un rythme à deux",
    lead: "Le temps affiché pour la conduite ne représente qu’une partie de la journée.",
    formula:
      "Durée de la journée ≈ conduite + pauses + repas + activités + marge",
    items: [
      "Limiter le nombre d’activités par jour",
      "Prévoir une marge entre les blocs",
      "Éviter d’enchaîner trop d’étapes juste « pour en profiter »",
      "Alterner moments actifs et moments plus calmes",
    ],
    tip: "Cette formule est conceptuelle : adaptez-la à votre énergie du jour, pas à une norme universelle.",
  },
  activites: {
    id: "activites",
    title: "Choisir des activités communes",
    lead: "Une bonne activité dépend des intérêts, de la durée, de la météo, de l’heure et du temps de déplacement.",
    categories: [
      "Nature et promenade",
      "Culture et musée",
      "Visite gourmande",
      "Activité extérieure",
      "Activité intérieure",
      "Point de vue ou pause paysage",
    ],
    note: "Vérifiez horaires, disponibilités et conditions auprès du lieu. Sebavia ne garantit ni la disponibilité ni qu’une activité convient à tous les couples.",
  },
  repas: {
    id: "repas",
    title: "Repas et moments gourmands",
    lead: "Les repas font souvent partie du plaisir du voyage — sans devoir tout réserver à l’avance.",
    items: [
      "Repas planifié ou improvisé selon le style",
      "Options de rechange si l’attente est longue",
      "Collations pour la route",
      "Eau accessible",
      "Contraintes alimentaires à confirmer sur place",
      "Repas à l’hébergement, si utile",
    ],
    tip: "Les besoins alimentaires particuliers doivent être confirmés directement auprès des établissements.",
  },
  hebergement: {
    id: "hebergement",
    title: "Hébergement et arrivée",
    lead: "L’heure d’arrivée et la distance après la dernière activité influencent autant le confort que le type de chambre.",
    items: [
      "Distance après la dernière activité",
      "Heure d’arrivée réaliste",
      "Stationnement",
      "Type d’hébergement recherché",
      "Politique d’annulation",
      "Proximité du prochain départ",
      "Ambiance et calme",
    ],
    note: "Sebavia peut aider à proposer ou intégrer un hébergement selon les fonctions disponibles. La réservation reste à faire auprès du fournisseur ; prix et disponibilités doivent être confirmés.",
  },
  tempsLibre: {
    id: "temps-libre",
    title: "Garder du temps libre",
    lead: "Un horaire trop plein laisse peu de place à la spontanéité — pourtant c’est souvent ce qui rend l’escapade agréable.",
    items: [
      "Un créneau sans activité obligatoire",
      "Une activité facultative plutôt que deux obligatoires",
      "Du temps pour se poser à l’hébergement",
      "La possibilité de raccourcir la journée",
    ],
  },
  meteo: {
    id: "meteo",
    title: "Météo et plan de rechange",
    lead: "Prévoir une option intérieure et une option extérieure évite de tout reconstruire si le temps change.",
    items: [
      "Activité extérieure prévue",
      "Option intérieure de remplacement",
      "Vêtements adaptés",
      "Revérification des prévisions avant le départ",
    ],
    note: "Les prévisions évoluent. Sebavia n’est pas une source officielle d’alerte.",
    link: {
      href: "/meteo-voyage",
      label: "Comment Sebavia présente la météo du voyage",
    },
  },
  carburant: {
    id: "carburant",
    title: "Carburant et pauses",
    lead: "Même pour une escapade courte, tenez compte du véhicule, de la consommation, de l’aller-retour et des détours.",
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
  budget: {
    id: "budget",
    title: "Budget à deux",
    lead: "Les catégories principales restent les mêmes ; le style d’escapade change surtout les montants.",
    items: [
      "Hébergement",
      "Repas",
      "Activités",
      "Carburant",
      "Stationnement",
      "Marge pour les imprévus",
    ],
    tip: "Il n’existe pas de budget moyen universel pour un voyage en couple.",
    link: {
      href: "/guides/budget-road-trip-quebec",
      label: "Préparer le budget global du road trip",
    },
  },
  decisions: {
    id: "decisions",
    title: "Décider ensemble",
    lead: "Quelques façons simples d’aligner les envies sans transformer le voyage en négociation permanente.",
    items: [
      "Chacun propose une activité prioritaire",
      "Alterner les choix si les goûts diffèrent",
      "Fixer une durée maximale de conduite avant de chercher la destination",
      "Garder une activité facultative",
      "Revoir le plan si l’énergie baisse",
    ],
    tip: "Ce guide n’est pas un conseil relationnel : adaptez ces pistes à votre façon de décider.",
  },
  checklist: {
    id: "checklist-couple",
    title: "Checklist avant le départ",
    lead: "Liste imprimable — à adapter selon la durée de l’escapade.",
    groups: [
      {
        title: "Avant le départ",
        items: [
          "Dates confirmées",
          "Style d’escapade clarifié",
          "Durée maximale de conduite",
          "Hébergement confirmé si besoin",
          "Trajet et retour",
          "Véhicule et carburant",
          "Météo",
          "Documents",
          "Réservations utiles",
        ],
      },
      {
        title: "Pour la route",
        items: [
          "Eau et collations",
          "Chargeurs",
          "Plan des pauses",
          "Option d’activité de rechange",
          "Moyens de paiement",
        ],
      },
      {
        title: "Sur place",
        items: [
          "Horaires confirmés",
          "Vêtements adaptés",
          "Temps libre prévu",
          "Marge si le plan change",
        ],
      },
    ],
  },
  sebavia: {
    id: "sebavia",
    title: "Comment Sebavia peut aider",
    lead: "Sebavia peut aider à organiser l’escapade ; elle ne remplace pas vos choix et ne réserve pas à votre place.",
    links: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur",
        body: "Cadre, étapes, activités et rythme du parcours.",
      },
      {
        href: "/assistant-voyage-ia",
        label: "Assistant voyage",
        body: "Démarrer une escapade en couple en conversation.",
      },
      {
        href: "/fonctionnalites",
        label: "Fonctionnalités",
        body: "Profils de sortie, intérêts et organisation globale.",
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
      "Chaque couple voyage différemment. Ces conseils restent généraux et n’imposent aucun style de séjour.",
      "Confirmez les informations des établissements, les conditions météo et routières, ainsi que les règles applicables auprès des sources appropriées.",
    ],
  },
  printNote:
    "Astuce : utilisez la fonction d’impression de votre navigateur pour emporter la checklist et l’exemple d’escapade.",
  finalCta: {
    title: "Passez de l’idée d’escapade à un parcours organisé",
    body: "Sebavia peut aider à rassembler étapes, activités, météo et carburant pour votre voyage à deux.",
    primary: { href: "/register", label: "Planifier notre escapade" },
    secondary: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrir le planificateur",
    },
    guidesLink: { href: "/guides", label: "Retour aux guides" },
  },
} as const;
