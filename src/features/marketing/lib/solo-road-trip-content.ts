/**
 * Contenu informatif du guide /guides/road-trip-solo-quebec.
 * Intention : préparer un road trip solo — distinct famille, couple, budget, checklist, planificateur.
 */

export const SOLO_DAY_EXAMPLE = {
  title: "Exemple de journée",
  disclaimer:
    "Horaire fictif à adapter à votre rythme. Aucun lieu, commerce, distance ni prix réel n’est recommandé ici.",
  scenario:
    "Scénario fictif pour illustrer une journée solo : route raisonnable, pause, repas, activité et arrivée sans précipitation.",
  blocks: [
    {
      time: "Matin",
      title: "Départ et première portion de route",
      body: "Départ reposé, conduite dans la limite choisie, avec une pause prévue plutôt qu’un horaire trop serré.",
    },
    {
      time: "Midi",
      title: "Repas et pause",
      body: "Repas simple ou restaurant selon l’énergie du jour, puis un moment pour se dégourdir avant de reprendre.",
    },
    {
      time: "Après-midi",
      title: "Activité et trajet vers l’hébergement",
      body: "Une activité choisie selon les intérêts, puis une portion plus courte pour arriver sans précipitation.",
    },
    {
      time: "Soirée",
      title: "Installation, météo et message optionnel",
      body: "Installation, coup d’œil aux prévisions et, si vous le souhaitez, un message à une personne de confiance — sans localisation en temps réel.",
    },
  ],
} as const;

export const SOLO_GUIDE = {
  meta: {
    title: "Road trip solo au Québec : guide pratique | Sebavia",
    description:
      "Préparez votre road trip solo au Québec : itinéraire, pauses, hébergement, météo, carburant, budget et checklist avant le départ.",
  },
  hero: {
    eyebrow: "Guide · Solo",
    title: "Road trip solo au Québec : bien préparer son voyage",
    body: "Un voyage solo offre beaucoup de liberté. Un cadre clair aide à gérer la conduite, les pauses, les activités, l’hébergement et les changements de plan — sans tout improviser ni tout planifier à la minute.",
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
    title: "La liberté avec un minimum de structure",
    paragraphs: [
      "Voyager seul permet de choisir son rythme, de modifier ses activités, de partir selon ses disponibilités et de garder du temps libre. Voyager seul ne signifie pas devoir tout improviser ni tout planifier à la minute.",
      "Quelques éléments méritent d’être préparés : durée de conduite, pauses, arrivée, hébergement, carburant, météo, communications et solutions de rechange. Respectez les règles applicables, préparez le voyage lorsque le véhicule est stationné et arrêtez-vous dès que la fatigue se fait sentir.",
    ],
  },
  toc: [
    { id: "cadre", label: "Définir le cadre du voyage" },
    { id: "destination", label: "Destination connue ou idée à préciser" },
    { id: "rythme", label: "Établir un rythme réaliste" },
    { id: "fatigue", label: "Fatigue et pauses" },
    {
      id: "confiance",
      label: "Partager le plan avec une personne de confiance",
    },
    { id: "activites", label: "Activités en solo" },
    { id: "repas", label: "Repas pendant un voyage solo" },
    { id: "hebergement", label: "Hébergement et heure d’arrivée" },
    { id: "communications", label: "Téléphone, batterie et communications" },
    { id: "vehicule", label: "Véhicule et préparation" },
    { id: "carburant", label: "Carburant et autonomie" },
    { id: "meteo", label: "Météo et conditions routières" },
    { id: "budget", label: "Budget d’un voyage solo" },
    { id: "exemple", label: "Exemple de journée solo" },
    { id: "rechange", label: "Garder une solution de rechange" },
    { id: "checklist-solo", label: "Checklist solo" },
    { id: "sebavia", label: "Comment Sebavia peut aider" },
    { id: "limites", label: "Limites de ce guide" },
  ],
  cadre: {
    id: "cadre",
    title: "Définir le cadre du voyage",
    lead: "Clarifiez d’abord ce qui est tenable pour vous — avant de multiplier les activités.",
    items: [
      "Combien de jours sont disponibles",
      "Quelle durée maximale de conduite paraît réaliste",
      "Destination connue ou encore ouverte",
      "Aller-retour ou circuit",
      "Une ou plusieurs nuitées",
      "Intérêts",
      "Budget approximatif",
      "Saison",
      "Véhicule utilisé",
      "Heure d’arrivée souhaitée",
    ],
    tip: "Choisissez la durée maximale de conduite avant d’ajouter trop d’activités.",
    link: {
      href: "/planificateur-road-trip-quebec",
      label: "Structurer le cadre dans le planificateur",
    },
  },
  destination: {
    id: "destination",
    title: "Destination connue ou idée à préciser",
    known: {
      title: "Destination déjà choisie",
      body: "La planification porte surtout sur le trajet, les étapes, les activités, les repas, l’hébergement et le retour.",
    },
    open: {
      title: "Destination encore ouverte",
      body: "Vous pouvez définir le point de départ, une durée maximale, les dates, vos intérêts, le type d’activité et le besoin d’hébergement.",
    },
    note: "Sebavia peut aider à structurer ou suggérer un parcours selon ces critères — sans couvrir toutes les destinations possibles.",
    link: {
      href: "/assistant-voyage-ia",
      label: "Démarrer avec l’assistant voyage",
    },
  },
  rythme: {
    id: "rythme",
    title: "Établir un rythme réaliste",
    lead: "Le temps de conduite ne représente pas toute la journée.",
    formula:
      "Durée de la journée ≈ conduite + pauses + repas + activités + marge",
    items: [
      "Limiter les étapes inutiles",
      "Conserver une marge",
      "Éviter une arrivée trop serrée",
      "Prévoir du temps pour s’installer",
      "Garder une activité facultative",
      "Ne pas planifier chaque minute",
    ],
    tip: "Cette formule est conceptuelle : elle n’impose aucune norme universelle.",
  },
  fatigue: {
    id: "fatigue",
    title: "Fatigue et pauses",
    lead: "La fatigue peut apparaître même lorsque la distance semblait raisonnable. Il n’existe pas de durée de conduite unique valable pour tout le monde.",
    items: [
      "Partir reposé",
      "Prévoir des pauses",
      "Arrêter le véhicule dans un endroit approprié",
      "Ne pas poursuivre lorsqu’on se sent trop fatigué",
      "Éviter de dépendre d’un horaire trop serré",
      "Garder une marge pour une pause imprévue",
    ],
    tip: "Si la fatigue se fait sentir, arrêtez-vous dans un lieu approprié plutôt que de tenter de respecter l’horaire prévu. Une boisson n’est pas un substitut au repos.",
  },
  confiance: {
    id: "confiance",
    title: "Partager le plan avec une personne de confiance",
    lead: "Approche simple et respectueuse de la vie privée — sans suivi automatique ni diffusion publique.",
    items: [
      "Région ou destination générale",
      "Dates",
      "Hébergement",
      "Heure approximative d’arrivée",
      "Changement important au parcours, si utile",
    ],
    tip: "Choisissez volontairement ce qui est partagé. Évitez de publier inutilement votre emplacement exact ou les détails d’un hébergement. Sebavia ne partage pas automatiquement ces informations.",
  },
  activites: {
    id: "activites",
    title: "Activités en solo",
    lead: "Des catégories génériques — à adapter à vos intérêts, sans établissement nommé.",
    categories: [
      "Randonnée ou promenade adaptée",
      "Musée",
      "Visite culturelle",
      "Activité gourmande",
      "Photographie",
      "Point de vue",
      "Activité intérieure",
      "Événement",
      "Découverte locale",
    ],
    note: "Vérifiez les horaires, les conditions et les exigences directement auprès du lieu concerné. Sebavia ne garantit ni la disponibilité ni l’accessibilité d’une activité.",
    guideLink: {
      href: "/guides/road-trip-nature-quebec",
      label: "Organiser un road trip nature",
    },
  },
  repas: {
    id: "repas",
    title: "Repas pendant un voyage solo",
    lead: "Plusieurs options selon le rythme et le temps disponible.",
    items: [
      "Restaurant ou comptoir",
      "Épicerie",
      "Pique-nique",
      "Repas à l’hébergement",
      "Collations pour la route",
      "Heures d’ouverture et options de rechange",
    ],
    tip: "Les besoins alimentaires particuliers doivent être confirmés directement auprès des établissements. Sebavia ne gère pas les allergies.",
  },
  hebergement: {
    id: "hebergement",
    title: "Hébergement et heure d’arrivée",
    lead: "L’heure d’arrivée et la distance après la dernière activité influencent autant le confort que le type de chambre.",
    items: [
      "Distance après la dernière activité",
      "Heure d’arrivée réaliste",
      "Stationnement",
      "Procédure d’arrivée",
      "Politique d’annulation",
      "Proximité du prochain départ",
      "Confirmation de réservation",
    ],
    note: "Sebavia peut aider à proposer ou intégrer un hébergement selon les fonctions disponibles. Aucune réservation directe : prix, disponibilités et conditions restent à confirmer auprès du fournisseur.",
  },
  communications: {
    id: "communications",
    title: "Téléphone, batterie et communications",
    lead: "Quelques rappels généraux — sans recommander de marque ni d’application hors ligne.",
    items: [
      "Téléphone chargé",
      "Chargeur pour véhicule",
      "Câble compatible",
      "Batterie externe, si déjà possédée",
      "Coordonnées importantes",
      "Confirmation de l’hébergement",
      "Itinéraire consultable",
      "Contenu téléchargé lorsque pertinent",
    ],
    tip: "Configurez les outils nécessaires lorsque le véhicule est stationné. Ne manipulez pas le téléphone en conduisant.",
  },
  vehicule: {
    id: "vehicule",
    title: "Véhicule et préparation",
    lead: "Checklist générale — pas un diagnostic. Pour une vérification mécanique ou un problème particulier, consultez un professionnel qualifié.",
    items: [
      "Carburant",
      "Consommation configurée",
      "Pneus (contrôle visuel simple)",
      "Éclairage",
      "Liquide lave-glace",
      "Documents",
      "Chargeurs",
      "Rangement",
      "Eau",
      "Vêtements",
      "Trousse générale",
    ],
  },
  carburant: {
    id: "carburant",
    title: "Carburant et autonomie",
    lead: "Tenez compte du véhicule, du réservoir, de la consommation, du carburant initial, de la distance, de l’aller-retour, des détours et des arrêts possibles.",
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
    title: "Météo et conditions routières",
    lead: "La météo peut influencer l’heure de départ, les vêtements, l’activité, la durée du trajet et le plan de rechange.",
    items: [
      "Prévisions autour des dates du voyage",
      "Revérification avant le départ",
      "Option intérieure de remplacement",
      "Conditions routières via les sources officielles lorsque pertinent",
    ],
    note: "Les prévisions évoluent. Météo et conditions routières sont différentes. Sebavia n’est pas une source officielle d’alerte ni d’état des routes.",
    link: {
      href: "/meteo-voyage",
      label: "Comment Sebavia présente la météo du voyage",
    },
  },
  budget: {
    id: "budget",
    title: "Budget d’un voyage solo",
    lead: "Certaines dépenses ne sont pas divisées entre plusieurs voyageurs — sans que le voyage solo soit nécessairement plus cher ou moins cher.",
    items: [
      "Hébergement",
      "Carburant",
      "Repas",
      "Activités",
      "Stationnement",
      "Dépenses personnelles",
      "Marge",
    ],
    link: {
      href: "/guides/budget-road-trip-quebec",
      label: "Préparer le budget global du road trip",
    },
  },
  rechange: {
    id: "rechange",
    title: "Garder une solution de rechange",
    lead: "Un plan flexible peut être plus utile qu’un horaire rempli.",
    items: [
      "Activité intérieure",
      "Repas simple",
      "Arrivée plus tôt",
      "Activité facultative",
      "Itinéraire raccourci",
      "Hébergement confirmé",
      "Pause supplémentaire",
      "Modification du retour",
    ],
  },
  checklist: {
    id: "checklist-solo",
    title: "Checklist solo",
    lead: "Liste imprimable — à adapter selon la durée du voyage.",
    groups: [
      {
        title: "Avant le départ",
        items: [
          "Dates",
          "Destination ou cadre",
          "Durée maximale",
          "Itinéraire",
          "Retour",
          "Hébergement",
          "Météo",
          "Véhicule",
          "Carburant",
          "Documents",
          "Réservations",
          "Budget",
          "Personne de confiance informée, selon votre choix",
        ],
      },
      {
        title: "Pour la route",
        items: [
          "Téléphone chargé",
          "Chargeur",
          "Eau",
          "Collations",
          "Vêtements",
          "Pauses",
          "Confirmations accessibles",
          "Solution de rechange",
          "Coordonnées utiles",
        ],
      },
      {
        title: "Avant chaque journée",
        items: [
          "Météo revérifiée",
          "Conditions routières officielles consultées lorsque nécessaire",
          "Niveau de carburant",
          "Activité confirmée",
          "Hébergement confirmé",
          "Heure d’arrivée réaliste",
          "Marge dans l’horaire",
        ],
      },
    ],
  },
  sebavia: {
    id: "sebavia",
    title: "Comment Sebavia peut aider",
    lead: "Sebavia peut aider à organiser le parcours. Ce n’est ni un service d’urgence, ni un système de surveillance, ni un outil de partage de localisation.",
    links: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur",
        body: "Cadre, étapes, activités et rythme du parcours.",
      },
      {
        href: "/assistant-voyage-ia",
        label: "Assistant voyage",
        body: "Démarrer ou ajuster un voyage solo en conversation.",
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
      "Chaque voyageur a des besoins différents. Ces conseils restent généraux et ne remplacent pas un avis professionnel ou officiel.",
      "Confirmez les établissements, revérifiez météo et conditions routières, et respectez les règles applicables.",
    ],
  },
  printNote:
    "Astuce : utilisez la fonction d’impression de votre navigateur pour emporter la checklist et l’exemple de journée.",
  finalCta: {
    title: "Transformez votre idée de voyage solo en parcours organisé",
    body: "Sebavia peut aider à réunir itinéraire, activités, météo et carburant dans un même voyage.",
    primary: { href: "/register", label: "Planifier mon voyage" },
    secondary: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrir le planificateur",
    },
    guidesLink: { href: "/guides", label: "Retour aux guides" },
  },
} as const;
