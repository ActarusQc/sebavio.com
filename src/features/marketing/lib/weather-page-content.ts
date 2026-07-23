/**
 * Contenu public de /meteo-voyage.
 * Angle : prévisions liées au départ, à la destination et aux dates du voyage.
 */

export const WEATHER_PAGE = {
  meta: {
    title: "Météo de voyage et prévisions du trajet | Sebavia",
    description:
      "Consultez les prévisions météo au départ et à destination selon les dates de votre voyage routier avec le planificateur Sebavia.",
  },
  hero: {
    eyebrow: "Prévisions liées au voyage",
    title: "Météo de voyage : préparez votre trajet selon les prévisions",
    body: "Sebavia relie les prévisions aux dates et aux lieux de votre voyage pour vous aider à préparer le départ, les activités et l’arrivée.",
    primaryCta: { href: "/register", label: "Planifier mon voyage" },
    secondaryCta: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrir le planificateur",
    },
    featuresLink: {
      href: "/fonctionnalites#meteo",
      label: "Voir les fonctions météo",
    },
  },
  context: {
    title: "La météo au bon endroit et au bon moment",
    lead: "La météo générale d’une région ne suffit pas toujours. Le contexte du voyage compte.",
    items: [
      "Lieu de départ",
      "Destination",
      "Dates prévues",
      "Moment approximatif du déplacement",
      "Durée du voyage",
      "Activités prévues",
    ],
    example:
      "Il peut faire beau au départ et pleuvoir à destination quelques heures plus tard.",
    note: "Sebavia associe les prévisions disponibles aux lieux et aux dates configurés dans le voyage.",
  },
  dual: {
    title: "Départ et destination",
    lead: "Dans le voyage, les prévisions sont présentées en distinguant clairement le départ et l’arrivée.",
    departure: {
      title: "Au départ",
      items: [
        "Préparer l’heure de départ",
        "Choisir les vêtements",
        "Organiser le chargement du véhicule",
        "Anticiper les premières heures du trajet",
      ],
    },
    arrival: {
      title: "À l’arrivée",
      items: [
        "Préparer les activités",
        "Anticiper l’arrivée et le séjour",
        "Ajuster les vêtements",
        "Prévoir un plan de rechange si besoin",
      ],
    },
    note: "Sebavia présente les prévisions pour vous aider à préparer : elle ne modifie pas automatiquement vos activités ni votre heure de départ.",
  },
  dates: {
    title: "Les prévisions selon les dates du voyage",
    lead: "La météo présentée correspond aux dates prévues du voyage, et non uniquement à la météo du jour.",
    items: [
      "Prévisions disponibles autour de la date de départ",
      "Prévisions disponibles autour de l’arrivée",
      "Horizon limité des données météorologiques",
      "Message lorsque le voyage est encore trop éloigné",
    ],
    note: "Une prévision éloignée est moins certaine. Les données deviennent généralement plus utiles à l’approche du départ : revérifiez-les.",
  },
  multiDay: {
    title: "Plusieurs jours, plusieurs conditions",
    lead: "Selon les dates et la disponibilité des prévisions, Sebavia présente les conditions utiles autour du départ et de la destination.",
    items: [
      "Jour du départ et jours suivants lorsque disponibles",
      "Période autour de l’arrivée",
      "Distinction visuelle entre les deux contextes",
    ],
  },
  activities: {
    title: "Préparer les activités",
    lead: "Les prévisions peuvent vous aider à décider si une activité doit être confirmée, déplacée ou remplacée.",
    examples: [
      "Activité extérieure ou randonnée",
      "Visite intérieure",
      "Repas sur une terrasse",
      "Promenade ou activité saisonnière",
    ],
    note: "Sebavia ne déplace pas automatiquement une activité selon la météo : vous gardez le contrôle.",
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Voir comment organiser un road trip",
    },
  },
  packing: {
    title: "Préparer le véhicule et les bagages",
    lead: "Les prévisions aident à penser à l’essentiel avant de prendre la route.",
    items: [
      "Vêtements adaptés",
      "Imperméable ou manteau",
      "Chaussures appropriées",
      "Équipements saisonniers",
      "Protection des bagages",
      "Eau et couverture au besoin",
    ],
    note: "Cette liste reste générale : elle ne remplace pas une vérification complète du véhicule.",
  },
  roads: {
    title: "Météo et conditions routières ne sont pas la même chose",
    lead: "Sebavia peut présenter des prévisions météorologiques, mais cela ne remplace pas les avis routiers officiels.",
    items: [
      "Fermetures de routes",
      "Travaux",
      "Conditions de chaussée",
      "Alertes et consignes des autorités",
    ],
    note: "Consultez les sources officielles avant le départ lorsque les conditions peuvent affecter la sécurité du trajet.",
    termsLink: {
      href: "/conditions-utilisation",
      label: "Conditions d’utilisation",
    },
  },
  conditions: {
    title: "Température, précipitations et vent",
    lead: "Selon les prévisions disponibles, Sebavia peut afficher des indications utiles pour préparer le trajet.",
    items: [
      {
        title: "Température",
        body: "Minimale et maximale pour préparer vêtements et activités.",
      },
      {
        title: "Conditions générales",
        body: "Description et icône pour saisir rapidement le type de journée.",
      },
      {
        title: "Précipitations",
        body: "Indication de pluie possible dans la vue détaillée, lorsque disponible.",
      },
      {
        title: "Vent",
        body: "Vitesse du vent dans la vue détaillée, lorsque disponible.",
      },
    ],
    note: "Ces indicateurs sont des estimations : ils ne sont pas des certitudes.",
  },
  updates: {
    title: "La météo peut changer après la création du voyage",
    lead: "Les prévisions évoluent. Consultez de nouveau votre voyage à l’approche du départ afin de voir les prévisions disponibles les plus récentes.",
    items: [
      "Revisite de la fiche voyage",
      "Approche des dates prévues",
      "Modification de la destination ou des dates",
    ],
    note: "Sebavia ne surveille pas constamment les changements et n’envoie pas automatiquement d’alertes météo.",
  },
  process: {
    title: "Comment Sebavia intègre la météo au voyage",
    steps: [
      "Vous définissez le départ, la destination et les dates.",
      "Sebavia associe les prévisions disponibles aux lieux du voyage.",
      "La météo est présentée dans le contexte du trajet.",
      "Vous adaptez votre préparation et vos activités.",
      "Vous revérifiez les prévisions à l’approche du départ.",
    ],
  },
  example: {
    label: "Exemple de présentation",
    disclaimer:
      "Données fictives. Les prévisions réelles dépendent du voyage et peuvent changer.",
    departure: {
      title: "Au départ",
      moment: "Matin",
      condition: "Partiellement nuageux",
      temp: "12 ° / 18 °",
      tip: "Prévoir un chandail léger",
    },
    arrival: {
      title: "À l’arrivée",
      moment: "Plus tard dans la journée",
      condition: "Averses possibles",
      temp: "10 ° / 15 °",
      tip: "Activité extérieure à confirmer",
    },
  },
  adapt: {
    title: "Adapter le voyage sans tout recommencer",
    lead: "Vous pouvez modifier plusieurs éléments et conserver le reste du voyage.",
    items: [
      "Modifier les dates",
      "Changer la destination",
      "Ajuster l’heure de départ",
      "Remplacer une activité",
      "Consulter de nouvelles prévisions",
    ],
    note: "La météo n’entraîne pas automatiquement un recalcul complet du voyage.",
    assistantLink: {
      href: "/assistant-voyage-ia",
      label: "Voir comment l’assistant peut ajuster le voyage",
    },
  },
  useCases: [
    {
      title: "Escapade de fin de semaine",
      body: "Comparez le départ et la destination, préparez les activités, puis revérifiez les prévisions avant de partir.",
    },
    {
      title: "Voyage familial",
      body: "Anticipez les vêtements, prévoyez un plan intérieur et ajustez le rythme selon les conditions attendues.",
    },
    {
      title: "Long road trip",
      body: "Les conditions peuvent différer entre les lieux : consultez la météo du voyage et les sources officielles pour la route.",
    },
    {
      title: "Voyage saisonnier",
      body: "Préparez une activité extérieure et le véhicule selon les conditions variables autour de vos dates.",
    },
  ],
  limits: {
    title: "Limites des prévisions",
    lead: "Une prévision reste une estimation. Les conditions peuvent évoluer.",
    items: [
      "L’horizon disponible est limité",
      "Une météo locale peut différer",
      "Les conditions routières se vérifient séparément",
      "Les activités et établissements peuvent adapter leurs opérations",
    ],
    faqLink: { href: "/faq", label: "FAQ" },
    termsLink: {
      href: "/conditions-utilisation",
      label: "Conditions d’utilisation",
    },
  },
  plans: {
    title: "Quel forfait pour la météo du voyage?",
    lead: "La période de prévisions et les fonctions disponibles dépendent du forfait et de la proximité des dates du voyage. Les détails officiels sont sur la page Tarifs.",
    cta: { href: "/pricing", label: "Comparer les forfaits" },
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Comment voir la météo de mon voyage dans Sebavia?",
        a: "Après avoir défini le départ, la destination et les dates, consultez la fiche du voyage. Les prévisions disponibles apparaissent dans le contexte du trajet.",
      },
      {
        q: "Sebavia affiche-t-il la météo du départ et de la destination?",
        a: "Oui. Lorsque les données sont disponibles, les prévisions sont présentées en distinguant le départ et l’arrivée.",
      },
      {
        q: "Les prévisions correspondent-elles aux dates du voyage?",
        a: "Oui. Sebavia associe les prévisions disponibles aux dates configurées, et non uniquement à la météo du jour.",
      },
      {
        q: "Combien de jours de météo sont disponibles?",
        a: "Selon les dates et la disponibilité des prévisions, Sebavia présente les conditions utiles autour du départ et de la destination. La période accessible dépend aussi du forfait.",
      },
      {
        q: "Puis-je voir la météo d’un voyage prévu plusieurs mois à l’avance?",
        a: "Pas toujours. Si le voyage est trop éloigné, un message indique que les prévisions seront disponibles à l’approche des dates.",
      },
      {
        q: "Les prévisions sont-elles garanties?",
        a: "Non. Une prévision est une estimation qui peut évoluer. Revérifiez à l’approche du départ.",
      },
      {
        q: "Sebavia affiche-t-il les conditions routières?",
        a: "Non. La météo du voyage ne remplace pas les avis routiers officiels, les fermetures ou les consignes des autorités.",
      },
      {
        q: "La météo est-elle mise à jour si je change mes dates?",
        a: "Oui. Après modification des dates ou de la destination, consultez de nouveau le voyage pour voir les prévisions disponibles.",
      },
    ],
    moreHref: "/faq",
    moreLabel: "Voir la FAQ générale",
  },
  finalCta: {
    title: "Planifiez votre voyage avec la météo en contexte",
    body: "Définissez vos dates, votre départ et votre destination pour consulter les prévisions disponibles dans votre voyage Sebavia.",
    primary: { href: "/register", label: "Créer mon voyage" },
    secondary: { href: "/pricing", label: "Comparer les forfaits" },
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrir le planificateur de road trip",
    },
  },
} as const;
