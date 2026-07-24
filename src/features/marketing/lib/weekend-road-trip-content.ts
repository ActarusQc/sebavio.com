/**
 * Contenu informatif du guide /guides/escapade-fin-de-semaine-quebec.
 * Intention : organiser une courte escapade (2–3 jours) — distinct profils, budget, checklist, planificateur.
 */

export const WEEKEND_DAY_EXAMPLE = {
  title: "Exemple de fin de semaine",
  disclaimer:
    "Horaire fictif à adapter. Aucun lieu, commerce, hôtel, distance ni prix réel n’est recommandé ici.",
  scenario:
    "Scénario fictif pour illustrer une escapade courte : départ, journée principale et retour avec une marge.",
  blocks: [
    {
      time: "Vendredi ou samedi",
      title: "Départ, route et installation",
      body: "Départ selon l’heure réellement disponible, portion de route raisonnable, pause, arrivée et installation sans précipitation.",
    },
    {
      time: "Journée principale",
      title: "Activité prioritaire et temps libre",
      body: "Déjeuner, une activité prioritaire, un repas, du temps libre et une activité facultative si l’énergie le permet.",
    },
    {
      time: "Retour",
      title: "Départ raisonnable et marge",
      body: "Départ pour le retour avec pause, vérification du carburant et arrivée avec une marge avant les obligations du lendemain.",
    },
  ],
} as const;

export const WEEKEND_GUIDE = {
  meta: {
    title: "Escapade de fin de semaine au Québec : guide | Sebavia",
    description:
      "Organisez une escapade de fin de semaine au Québec : durée de route, activités, hébergement, météo, carburant et trajet de retour.",
  },
  hero: {
    eyebrow: "Guide · Court séjour",
    title: "Escapade de fin de semaine au Québec : bien organiser le séjour",
    body: "Deux ou trois jours demandent une distance raisonnable, un retour anticipé et des activités limitées — pour profiter de la destination, pas seulement pour s’y rendre.",
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
    title: "Commencer par le temps réellement disponible",
    paragraphs: [
      "Une escapade réussie laisse du temps pour profiter de la destination, pas seulement pour s’y rendre. Une « fin de semaine » peut signifier un départ le vendredi après le travail, tôt le samedi, une ou deux nuitées, un retour le dimanche, ou une journée supplémentaire lors d’un congé. Un week-end compact n’est jamais exactement le même pour tout le monde.",
      "Avant de choisir une destination, clarifiez : à quelle heure peut-on réellement partir? À quelle heure faut-il être revenu? Combien de nuitées sont possibles? Combien de temps souhaite-t-on conduire? Veut-on surtout visiter, se reposer ou faire des activités?",
    ],
  },
  toc: [
    { id: "conduite", label: "Définir la durée maximale de conduite" },
    { id: "nuitees", label: "Une nuitée ou deux?" },
    { id: "destination", label: "Destination connue ou critères de recherche" },
    { id: "dates", label: "Comprendre « cette fin de semaine »" },
    { id: "horaire", label: "Ne pas surcharger l’horaire" },
    { id: "journee", label: "Construire une journée réaliste" },
    { id: "activites", label: "Activités et intérêts" },
    { id: "repas", label: "Repas sans compliquer l’itinéraire" },
    { id: "hebergement", label: "Choisir l’hébergement" },
    { id: "retour", label: "Préparer le retour dès le départ" },
    { id: "budget", label: "Budget d’une courte escapade" },
    { id: "carburant", label: "Carburant et arrêts" },
    { id: "meteo", label: "Météo et plan de rechange" },
    { id: "profils", label: "Adapter selon le profil" },
    { id: "exemple", label: "Exemple de fin de semaine" },
    { id: "checklist-escapade", label: "Checklist escapade" },
    { id: "sebavia", label: "Comment Sebavia peut aider" },
    { id: "limites", label: "Limites de ce guide" },
  ],
  conduite: {
    id: "conduite",
    title: "Définir la durée maximale de conduite",
    lead: "La distance appropriée dépend du temps disponible et du rythme souhaité — pas d’une norme unique.",
    items: [
      "Heure de départ réelle",
      "Circulation possible",
      "Pauses",
      "Repas",
      "Activités prévues",
      "Installation à l’hébergement",
      "Trajet de retour",
      "Profil des voyageurs",
    ],
    tip: "Définissez d’abord le temps maximal que vous acceptez de consacrer à la route, puis cherchez une destination compatible.",
    link: {
      href: "/planificateur-road-trip-quebec",
      label: "Structurer le cadre dans le planificateur",
    },
  },
  nuitees: {
    id: "nuitees",
    title: "Une nuitée ou deux?",
    lead: "Aucune option n’est supérieure dans tous les cas : cela dépend du trajet et de l’énergie disponible.",
    one: {
      title: "Une nuitée",
      body: "Peut convenir lorsque le trajet reste raisonnable, l’objectif est simple, peu d’activités sont prévues et le départ est assez tôt.",
    },
    two: {
      title: "Deux nuitées",
      body: "Peut laisser davantage de temps pour profiter de la destination, répartir les activités, éviter un retour trop serré et adapter le séjour à la météo.",
    },
  },
  destination: {
    id: "destination",
    title: "Destination connue ou critères de recherche",
    known: {
      title: "Destination déjà choisie",
      body: "Organisez surtout l’aller, l’arrivée, les activités, la nuitée et le retour.",
    },
    open: {
      title: "Destination encore ouverte",
      body: "Définissez le point de départ, une durée maximale, les dates, le profil, les intérêts, le budget et le besoin d’hébergement.",
    },
    note: "L’assistant Sebavia peut aider à structurer ou suggérer un voyage selon ces critères — sans couvrir toutes les destinations possibles.",
    link: {
      href: "/assistant-voyage-ia",
      label: "Démarrer avec l’assistant voyage",
    },
  },
  dates: {
    id: "dates",
    title: "Comprendre « cette fin de semaine »",
    lead: "Les dates doivent toujours être vérifiées avant de confirmer le voyage.",
    items: [
      "Une expression comme « cette fin de semaine » peut être utilisée pour démarrer",
      "Les dates comprises doivent rester visibles dans le parcours",
      "Confirmez explicitement le départ et le retour",
      "Une nouvelle semaine ou un changement de jour peut modifier l’interprétation",
    ],
    tip: "Revérifiez toujours les dates affichées avant de réserver ou de partir. Une clarification peut rester utile.",
  },
  horaire: {
    id: "horaire",
    title: "Ne pas surcharger l’horaire",
    lead: "Un programme trop rempli fragilise rapidement une courte escapade.",
    risks: [
      "Retard dès la première activité",
      "Repas déplacé",
      "Arrivée tardive",
      "Fatigue",
      "Activité écourtée",
      "Retour précipité",
    ],
    structure: [
      "Une activité prioritaire",
      "Une activité secondaire",
      "Du temps libre",
      "Une solution de rechange",
    ],
    tip: "Cette structure est une aide pratique, pas une règle universelle.",
  },
  journee: {
    id: "journee",
    title: "Construire une journée réaliste",
    lead: "Le temps passé à destination doit rester suffisamment important par rapport au temps de déplacement.",
    formula:
      "Journée disponible ≈ conduite + pauses + repas + activités + installation + marge",
    tip: "Il s’agit d’une aide à la réflexion, pas d’une norme.",
  },
  activites: {
    id: "activites",
    title: "Activités et intérêts",
    lead: "Des catégories génériques — à adapter sans établissement nommé. Plusieurs intérêts peuvent être combinés lorsque c’est pertinent.",
    categories: [
      "Gastronomie",
      "Nature",
      "Culture",
      "Détente",
      "Magasinage",
      "Activité intérieure",
      "Événement saisonnier",
      "Visite locale",
    ],
    note: "Confirmez les horaires, restrictions et disponibilités directement auprès des lieux concernés.",
  },
  repas: {
    id: "repas",
    title: "Repas sans compliquer l’itinéraire",
    lead: "Un repas placé sur le parcours ou près d’une activité peut réduire les détours.",
    items: [
      "Restaurant prévu",
      "Repas rapide",
      "Pique-nique",
      "Épicerie",
      "Repas à l’hébergement",
      "Option de rechange",
    ],
    tip: "Sebavia ne garantit ni réservation ni disponibilité d’un établissement.",
  },
  hebergement: {
    id: "hebergement",
    title: "Choisir l’hébergement",
    lead: "Pour une courte escapade, l’heure d’arrivée et la proximité du retour comptent autant que le type de chambre.",
    items: [
      "Distance après la dernière activité",
      "Heure d’arrivée",
      "Nombre de nuitées",
      "Stationnement",
      "Procédure d’arrivée",
      "Déjeuner éventuel",
      "Politique d’annulation",
      "Proximité du trajet de retour",
      "Services recherchés",
    ],
    note: "Sebavia peut proposer ou intégrer un hébergement selon ses fonctions. Aucune réservation directe : prix, disponibilité et conditions restent à confirmer.",
  },
  retour: {
    id: "retour",
    title: "Préparer le retour dès le départ",
    lead: "Une escapade courte peut devenir fatigante si le retour n’est pas anticipé.",
    items: [
      "Heure de départ pour le retour",
      "Durée estimée",
      "Pauses",
      "Repas",
      "Carburant",
      "Activité facultative éventuelle",
      "Marge avant les obligations du lendemain",
    ],
    tip: "Si la fatigue se fait sentir, arrêtez-vous plutôt que de forcer l’horaire. Préparez les outils lorsque le véhicule est stationné.",
  },
  budget: {
    id: "budget",
    title: "Budget d’une courte escapade",
    lead: "Un séjour court n’est pas nécessairement peu coûteux si plusieurs dépenses sont concentrées en peu de jours.",
    items: [
      "Carburant",
      "Hébergement",
      "Repas",
      "Activités",
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
    title: "Carburant et arrêts",
    lead: "Tenez compte du trajet aller-retour, du véhicule, de la consommation, du niveau initial, des détours et des stations à confirmer.",
    tip: "Ne repoussez pas un arrêt nécessaire pour économiser sur le prix.",
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
    title: "Météo et plan de rechange",
    lead: "La météo peut influencer l’activité, l’heure de départ, les vêtements, la route, le retour et le choix entre intérieur et extérieur.",
    items: [
      "Prévisions autour des dates",
      "Revérification avant le départ",
      "Option intérieure de remplacement",
      "Conditions routières via les sources officielles lorsque pertinent",
    ],
    note: "Les prévisions évoluent. Météo et conditions routières sont différentes. Sebavia n’est pas une source officielle d’alerte.",
    link: {
      href: "/meteo-voyage",
      label: "Comment Sebavia présente la météo du voyage",
    },
  },
  profils: {
    id: "profils",
    title: "Adapter selon le profil",
    lead: "Le même cadre de fin de semaine s’organise autrement selon qui voyage.",
    blocks: [
      {
        title: "Solo",
        items: ["Rythme personnel", "Pauses", "Communications", "Arrivée"],
        link: {
          href: "/guides/road-trip-solo-quebec",
          label: "Guide road trip solo",
        },
      },
      {
        title: "Couple",
        items: ["Intérêts communs", "Repas", "Temps libre", "Décisions à deux"],
        link: {
          href: "/guides/road-trip-couple-quebec",
          label: "Guide road trip en couple",
        },
      },
      {
        title: "Famille",
        items: [
          "Enfants",
          "Pauses",
          "Activités adaptées",
          "Rythme moins chargé",
        ],
        link: {
          href: "/guides/road-trip-famille-quebec",
          label: "Guide road trip en famille",
        },
      },
    ],
  },
  checklist: {
    id: "checklist-escapade",
    title: "Checklist escapade",
    lead: "Liste imprimable — à adapter selon une ou deux nuitées.",
    groups: [
      {
        title: "Avant de choisir la destination",
        items: [
          "Dates",
          "Heures disponibles",
          "Nombre de nuitées",
          "Durée maximale de conduite",
          "Profil",
          "Intérêts",
          "Budget",
        ],
      },
      {
        title: "Avant de réserver",
        items: [
          "Trajet aller-retour",
          "Hébergement",
          "Activités prioritaires",
          "Repas",
          "Météo approximative",
          "Politique d’annulation",
        ],
      },
      {
        title: "Avant de partir",
        items: [
          "Prévisions revérifiées",
          "Conditions routières vérifiées lorsque nécessaire",
          "Carburant",
          "Véhicule",
          "Réservations",
          "Heures d’ouverture",
          "Vêtements",
          "Chargeurs",
          "Retour",
          "Marge dans l’horaire",
        ],
      },
    ],
  },
  sebavia: {
    id: "sebavia",
    title: "Comment Sebavia peut aider",
    lead: "Sebavia peut aider à organiser une courte escapade. Ce n’est ni un service de réservation ni une garantie de résultat.",
    links: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur",
        body: "Cadre, étapes, activités et rythme du parcours.",
      },
      {
        href: "/assistant-voyage-ia",
        label: "Assistant voyage",
        body: "Démarrer une escapade à partir de dates et d’intérêts.",
      },
      {
        href: "/fonctionnalites",
        label: "Fonctionnalités",
        body: "Profils, intérêts et organisation globale.",
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
      "Chaque escapade est différente. Ces conseils restent généraux : horaires, disponibilités et prévisions évoluent.",
      "Confirmez les établissements, revérifiez météo et conditions routières, et adaptez le rythme à votre situation.",
    ],
  },
  printNote:
    "Astuce : utilisez la fonction d’impression de votre navigateur pour emporter la checklist et l’exemple de fin de semaine.",
  finalCta: {
    title: "Transformez votre prochaine fin de semaine en voyage organisé",
    body: "Sebavia peut aider à réunir dates, itinéraire, activités, météo et carburant dans une même escapade.",
    primary: { href: "/register", label: "Planifier mon escapade" },
    secondary: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrir le planificateur",
    },
    guidesLink: { href: "/guides", label: "Retour aux guides" },
  },
} as const;
