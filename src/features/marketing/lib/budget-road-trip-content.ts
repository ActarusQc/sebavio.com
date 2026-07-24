/**
 * Contenu informatif du guide /guides/budget-road-trip-quebec.
 * Intention : préparer le budget global d’un road trip — distinct du calculateur carburant.
 */

export const BUDGET_FICTIONAL_EXAMPLE = {
  title: "Exemple de budget fictif",
  disclaimer:
    "Ces valeurs servent uniquement à illustrer la méthode. Les prix réels varient selon la saison, le style de voyage et les lieux choisis — ce ne sont pas les prix actuels du Québec.",
  scenario:
    "Scénario fictif : deux adultes, trois jours, voyage en voiture, deux nuitées, repas mixtes, quelques activités, carburant et stationnement.",
  rows: [
    {
      category: "Carburant",
      hypothesis: "Trajet aller-retour (estimation)",
      amount: 160,
    },
    {
      category: "Hébergement",
      hypothesis: "Deux nuitées",
      amount: 300,
    },
    {
      category: "Repas",
      hypothesis: "Trois jours, mélange restaurant et repas simples",
      amount: 240,
    },
    {
      category: "Activités",
      hypothesis: "Deux activités payantes",
      amount: 80,
    },
    {
      category: "Stationnement et autres",
      hypothesis: "Estimation des frais de route",
      amount: 40,
    },
    {
      category: "Marge",
      hypothesis: "Imprévus",
      amount: 80,
    },
  ],
  currencyNote:
    "Montants fictifs en dollars canadiens, à titre d’exemple seulement.",
} as const;

export const BUDGET_FICTIONAL_TOTAL = BUDGET_FICTIONAL_EXAMPLE.rows.reduce(
  (sum, row) => sum + row.amount,
  0,
);

export const BUDGET_GUIDE = {
  meta: {
    title: "Budget road trip au Québec : coûts à prévoir | Sebavia",
    description:
      "Préparez le budget de votre road trip au Québec : carburant, hébergement, repas, activités, stationnement et marge pour les imprévus.",
  },
  hero: {
    eyebrow: "Guide · Budget",
    title: "Budget road trip au Québec : les coûts à prévoir",
    body: "Un budget de voyage routier va bien au-delà de l’essence. Ce guide aide à organiser les dépenses avant le départ — sans calculatrice publique ni prix présentés comme actuels.",
    primaryCta: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Estimer le carburant",
    },
    secondaryCta: {
      href: "/planificateur-road-trip-quebec",
      label: "Voir le planificateur",
    },
  },
  intro: {
    title: "Un budget plus large que l’essence",
    paragraphs: [
      "Le coût total d’un road trip au Québec dépend autant du style de voyage que de la distance. Camping, pique-niques et activités gratuites ne produisent pas le même budget que hôtels, restaurants et activités payantes.",
      "Les catégories principales à considérer peuvent comprendre le carburant, l’hébergement, les repas, les activités, le stationnement, les traversiers ou péages lorsque pertinents, les dépenses quotidiennes et une marge pour les imprévus.",
    ],
  },
  toc: [
    { id: "categories", label: "Principales catégories de dépenses" },
    { id: "fixes-variables", label: "Coûts fixes et variables" },
    { id: "methode", label: "Budget par jour et budget total" },
    { id: "exemple", label: "Exemple de budget fictif" },
    { id: "styles", label: "Budget selon le style de voyage" },
    { id: "oublis", label: "Dépenses souvent oubliées" },
    { id: "detours", label: "Effet des étapes et détours" },
    { id: "retour", label: "Budget d’un aller-retour" },
    { id: "marge", label: "Créer une marge réaliste" },
    { id: "reduire", label: "Réduire le budget sans tout couper" },
    { id: "suivi", label: "Suivre le budget avant le départ" },
    { id: "sebavia", label: "Où Sebavia peut aider" },
    { id: "checklist-budget", label: "Checklist de budget" },
    { id: "limites", label: "Limites de ce guide" },
  ],
  categories: {
    id: "categories",
    title: "Les principales catégories de dépenses",
    lead: "Parcourez chaque catégorie comme une case à cocher mentale : certaines s’appliqueront pleinement, d’autres peu ou pas du tout selon votre trajet.",
    items: [
      {
        title: "Carburant",
        body: "Prenez en compte la distance, la consommation du véhicule, le type de carburant, l’aller-retour, les étapes et détours, ainsi que le fait que les prix varient. L’estimation de cette part mérite un outil dédié.",
        link: {
          href: "/calculateur-cout-carburant-voyage",
          label: "Calculateur de coût de carburant",
        },
      },
      {
        title: "Hébergement",
        body: "Nombre de nuits, type d’hébergement, saison, emplacement, taxes, stationnement sur place et politique d’annulation influencent fortement le total. Confirmez toujours les montants auprès de l’établissement.",
      },
      {
        title: "Repas",
        body: "Restaurants, épicerie, pique-niques, collations, boissons et repas éventuellement inclus avec l’hébergement : le rythme alimentaire change beaucoup le budget quotidien.",
      },
      {
        title: "Activités",
        body: "Billets, réservations, location d’équipement, activités gratuites et activités saisonnières. Choisissez quelques priorités plutôt que de tout prévoir payant.",
      },
      {
        title: "Transport et frais de route",
        body: "Selon le parcours, il peut s’ajouter du stationnement, des traversiers, des péages, du transport local ou, pour certains véhicules, des frais de recharge. Tous les trajets n’incluent pas ces coûts.",
      },
      {
        title: "Imprévus",
        body: "Changement d’activité, repas non planifié, détour, météo, dépannage, prolongation ou petite dépense oubliée : une marge aide à absorber ces variations sans transformer chaque écart en stress.",
      },
    ],
  },
  fixedVariable: {
    id: "fixes-variables",
    title: "Coûts fixes et coûts variables",
    lead: "Cette distinction aide à voir ce qui est déjà engagé et ce qui peut encore être ajusté.",
    fixed: {
      title: "Coûts plutôt fixes",
      items: [
        "Réservation déjà payée",
        "Billet d’activité déjà acheté",
        "Assurance voyage particulière, si applicable",
        "Frais de réservation connus",
      ],
    },
    variable: {
      title: "Coûts plutôt variables",
      items: [
        "Carburant",
        "Repas",
        "Stationnement",
        "Activités ajoutées en cours de route",
        "Achats personnels",
        "Détours",
      ],
    },
    note: "Ce n’est pas un conseil financier personnalisé : adaptez la répartition à votre situation.",
  },
  method: {
    id: "methode",
    title: "Budget par jour et budget total",
    lead: "Une méthode générale suffit pour structurer les chiffres avant le départ.",
    steps: [
      "Estimer les dépenses uniques (ex. réservations déjà connues).",
      "Estimer les dépenses quotidiennes (repas, petites sorties).",
      "Multiplier les dépenses quotidiennes par le nombre de jours.",
      "Ajouter le transport et le carburant.",
      "Ajouter une marge pour les imprévus.",
    ],
    formula:
      "Budget total estimé = coûts fixes + dépenses quotidiennes + transport + marge",
  },
  styles: {
    id: "styles",
    title: "Budget selon le style de voyage",
    lead: "Trois profils conceptuels — sans montants — pour comparer des scénarios.",
    profiles: [
      {
        title: "Voyage économique",
        items: [
          "Hébergement simple",
          "Repas préparés",
          "Activités gratuites ou peu coûteuses",
          "Itinéraire resserré",
        ],
      },
      {
        title: "Voyage équilibré",
        items: [
          "Mélange de restaurants et de repas simples",
          "Hébergement intermédiaire",
          "Activités gratuites et payantes",
        ],
      },
      {
        title: "Voyage plus confortable",
        items: [
          "Hébergement plus complet",
          "Restaurants fréquents",
          "Activités payantes",
          "Marge plus élevée",
        ],
      },
    ],
  },
  forgotten: {
    id: "oublis",
    title: "Dépenses souvent oubliées",
    lead: "Possibilités à considérer — pas une liste obligatoire.",
    items: [
      "Taxes",
      "Stationnement",
      "Frais de réservation",
      "Pourboires",
      "Collations",
      "Glace ou boissons",
      "Données mobiles",
      "Buanderie",
      "Traversier",
      "Péage",
      "Équipement oublié",
      "Médicaments ou produits personnels",
      "Activités ajoutées sur place",
      "Souvenirs",
      "Frais d’annulation",
    ],
  },
  detours: {
    id: "detours",
    title: "Effet des étapes et détours sur le budget",
    lead: "Modifier le trajet peut changer le carburant, le stationnement, les repas, le nombre de nuitées, les activités, les heures d’arrivée et parfois les frais d’annulation.",
    links: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip au Québec",
      },
      {
        href: "/planifier-arrets-carburant",
        label: "Planifier les arrêts de carburant",
      },
    ],
  },
  roundTrip: {
    id: "retour",
    title: "Budget d’un aller-retour",
    lead: "Un budget fondé seulement sur l’aller est incomplet.",
    items: [
      "Le retour et les arrêts du trajet de retour",
      "Les repas du retour",
      "Un hébergement additionnel si le retour est divisé",
      "Le carburant de l’ensemble du parcours",
      "Les activités de dernière journée",
    ],
    note: "Pour affiner la part essence, utilisez le calculateur dédié plutôt que d’estimer à vue.",
    fuelLink: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Estimer le coût de carburant",
    },
  },
  margin: {
    id: "marge",
    title: "Créer une marge réaliste",
    lead: "Une marge sert à absorber les variations : prix différents, détour, météo, changement d’activité, repas supplémentaire, retard ou achat oublié.",
    tip: "Choisissez une marge adaptée à votre situation et à la flexibilité de votre voyage. Il n’existe pas de pourcentage unique valable pour tous.",
  },
  reduce: {
    id: "reduire",
    title: "Réduire le budget sans réduire tout le voyage",
    lead: "Des pistes générales — sans garantie d’économie et sans sacrifier un ravitaillement nécessaire ou une précaution de sécurité.",
    items: [
      "Limiter les détours inutiles",
      "Choisir quelques activités prioritaires",
      "Alterner restaurants et repas simples",
      "Comparer les options d’hébergement",
      "Réserver seulement lorsque les conditions vous conviennent",
      "Regrouper les activités dans un même secteur",
      "Prévoir les arrêts",
      "Éviter les achats de dernière minute lorsque possible",
    ],
  },
  tracking: {
    id: "suivi",
    title: "Suivre le budget avant le départ",
    lead: "Une méthode simple suffit pour rester clair avant de prendre la route.",
    items: [
      "Noter les réservations déjà payées",
      "Lister les montants restant à payer",
      "Distinguer estimations et montants confirmés",
      "Mettre à jour le budget lorsque le trajet change",
      "Conserver les confirmations accessibles",
      "Vérifier la limite ou le moyen de paiement",
    ],
    note: "Sebavia aide à structurer le trajet, le carburant, les activités et la météo du voyage. Ce n’est pas un module comptable complet.",
  },
  sebavia: {
    id: "sebavia",
    title: "Où Sebavia peut aider",
    lead: "Sebavia n’estime pas automatiquement tous les repas, hôtels et activités. Elle peut toutefois aider sur les éléments suivants.",
    links: [
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Coût de carburant",
        body: "Estimer la part essence du budget.",
      },
      {
        href: "/planifier-arrets-carburant",
        label: "Arrêts de carburant",
        body: "Anticiper l’autonomie et les arrêts possibles.",
      },
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur",
        body: "Structurer étapes, activités et rythme.",
      },
      {
        href: "/assistant-voyage-ia",
        label: "Assistant voyage",
        body: "Ajuster la planification en conversation.",
      },
      {
        href: "/meteo-voyage",
        label: "Météo du voyage",
        body: "Consulter des prévisions liées aux dates.",
      },
      {
        href: "/fonctionnalites",
        label: "Fonctionnalités",
        body: "Vue d’ensemble du catalogue.",
      },
      {
        href: "/pricing",
        label: "Tarifs",
        body: "Comprendre les forfaits disponibles.",
      },
    ],
  },
  checklist: {
    id: "checklist-budget",
    title: "Checklist de budget avant le départ",
    lead: "Liste imprimable pour une dernière passe avant le voyage.",
    items: [
      "Distance aller-retour confirmée",
      "Carburant estimé",
      "Hébergements confirmés",
      "Repas planifiés approximativement",
      "Activités prioritaires",
      "Stationnements possibles",
      "Traversiers ou péages vérifiés si pertinents",
      "Taxes et frais considérés",
      "Dépenses déjà payées",
      "Montants restant à payer",
      "Moyen de paiement",
      "Marge prévue",
      "Budget du retour",
      "Confirmations accessibles",
    ],
  },
  limits: {
    id: "limites",
    title: "Limites de ce guide",
    paragraphs: [
      "Les prix changent, les besoins varient selon les personnes et certaines dépenses restent imprévisibles. Confirmez toujours les coûts réels avant de partir.",
      "Ce contenu n’est pas un conseil financier personnalisé et ne couvre pas toutes les situations. Sebavia ne garantit ni les prix ni les disponibilités.",
    ],
  },
  printNote:
    "Astuce : utilisez la fonction d’impression de votre navigateur pour conserver le tableau et la checklist.",
  finalCta: {
    title: "Passez du budget au voyage organisé",
    body: "Une fois les grandes dépenses identifiées, Sebavia peut aider à structurer le trajet et la part carburant.",
    primary: { href: "/register", label: "Planifier mon voyage" },
    secondary: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Estimer le carburant",
    },
    guidesLink: { href: "/guides", label: "Retour aux guides" },
  },
} as const;
