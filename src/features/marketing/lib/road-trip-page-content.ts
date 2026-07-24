/**
 * Contenu public de /planificateur-road-trip-quebec.
 * Angle : méthode pour organiser un voyage routier au Québec (pas une copie de /fonctionnalites).
 */

export const ROAD_TRIP_PAGE = {
  meta: {
    title: "Planificateur de road trip au Québec | Sebavia",
    description:
      "Planifiez votre road trip au Québec avec Sebavia : itinéraire, étapes, activités, météo, hébergement et estimation du carburant.",
  },
  hero: {
    eyebrow: "Voyage routier au Québec",
    title: "Planificateur de road trip au Québec : organisez tout votre voyage",
    body: "Transformez une destination ou une simple idée en voyage routier organisé : itinéraire, étapes, activités, météo, hébergement et estimation du carburant — regroupés dans Sebavia.",
    primaryCta: { href: "/register", label: "Planifier mon road trip" },
    secondaryCta: {
      href: "/fonctionnalites",
      label: "Découvrir les fonctionnalités",
    },
    assistantLink: {
      href: "/assistant-voyage-ia",
      label: "Planifier en conversation",
    },
  },
  why: {
    title: "Pourquoi planifier son road trip à l’avance",
    lead: "Préparer un voyage routier ne se limite pas à relier un départ et une destination. Plusieurs décisions se croisent avant de prendre la route.",
    items: [
      "Combien de temps conduire par jour",
      "Où s’arrêter et que faire",
      "Où manger et, au besoin, où dormir",
      "Quel budget approximatif prévoir pour le carburant",
      "Quelle météo anticiper",
      "Comment ajuster le programme si quelque chose change",
    ],
  },
  start: {
    title: "Commencez par une destination ou une simple idée",
    known: {
      title: "Destination déjà choisie",
      body: "Une région, une ville à visiter, une étape chez des proches ou une activité qui motive le déplacement : vous pouvez partir de ce point et bâtir le parcours autour.",
    },
    open: {
      title: "Destination à trouver",
      body: "Indiquez plutôt votre point de départ, une durée maximale de route, vos dates, vos intérêts, le type de sortie et si vous avez besoin d’un hébergement. Sebavia peut alors vous aider à structurer ou suggérer un voyage selon ces critères.",
    },
    assistantLink: {
      href: "/assistant-voyage-ia",
      label: "Découvrir la planification en conversation",
    },
  },
  itinerary: {
    title: "Construisez un itinéraire réaliste",
    lead: "Sebavia calcule distance et durée estimée, affiche le parcours sur une carte et tient compte des étapes, pauses et activités ajoutées. Vous pouvez aussi préparer un retour.",
    items: [
      "Point de départ, destination et heure de départ",
      "Distance et durée estimées",
      "Étapes, pauses et activités sur le parcours",
      "Recalcul après modification",
      "Trajet aller et, au besoin, retour",
    ],
    example:
      "Un trajet annoncé à quatre heures peut devenir une journée complète après l’ajout d’un repas, d’une activité et de pauses.",
    note: "Sebavia aide à organiser le parcours ; ce n’est pas une navigation GPS en direct. Les conditions routières peuvent changer : consultez les avis officiels avant de partir.",
  },
  steps: {
    title: "Organisez les étapes de votre voyage",
    lead: "Sebavia aide à regrouper et ordonner les éléments de votre voyage dans le parcours.",
    items: [
      {
        term: "Destination",
        definition: "Le lieu ou la région qui motive le déplacement.",
      },
      {
        term: "Étape",
        definition:
          "Un point du parcours pour diviser la conduite, prévoir une visite ou une nuit.",
      },
      {
        term: "Pause",
        definition: "Un arrêt pour reprendre son souffle sans activité longue.",
      },
      {
        term: "Activité",
        definition: "Une visite ou une expérience avec une durée estimée.",
      },
      {
        term: "Arrêt repas",
        definition: "Un restaurant ou un moment pour manger sur le trajet.",
      },
      {
        term: "Hébergement",
        definition:
          "Un lieu proposé pour dormir, à confirmer auprès de l’établissement.",
      },
    ],
  },
  activities: {
    title: "Ajoutez des activités et des découvertes",
    lead: "Enrichissez le voyage selon vos intérêts et le type de sortie (solo, couple ou famille).",
    items: [
      "Suggestions d’activités adaptées au profil",
      "Ajout au trajet avec durée estimée",
      "Recherche d’un restaurant",
      "Proposition d’hébergement dans la planification",
      "Recalcul du parcours après ajout",
    ],
    note: "Aucune réservation directe. Disponibilités, horaires, tarifs et activités saisonnières doivent être confirmés auprès des lieux concernés.",
  },
  lodging: {
    title: "Prévoyez où dormir",
    lead: "L’assistant peut proposer un hébergement et l’intégrer au parcours, par exemple pour terminer près de la dernière activité ou éviter une journée trop longue.",
    items: [
      "Proposition d’un lieu où dormir",
      "Intégration dans le parcours planifié",
      "Confirmation des disponibilités et prix par le voyageur",
      "Aucune réservation gérée par Sebavia",
    ],
  },
  fuel: {
    title: "Préparez le budget de carburant",
    lead: "À partir de votre véhicule et du parcours, Sebavia estime consommation, coût et achats utiles pendant le trajet.",
    items: [
      "Véhicule, consommation et type de carburant",
      "Capacité du réservoir et plein initial",
      "Distance, aller ou aller-retour",
      "Mise à jour après activités ou modifications",
      "Nombre ou besoin possible de ravitaillements",
    ],
    note: "Les prix varient : l’estimation n’est pas une garantie.",
    featuresLink: {
      href: "/fonctionnalites#carburant",
      label: "Voir les fonctions carburant",
    },
    costCalculatorLink: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Voir comment le coût du carburant est calculé",
    },
    budgetGuideLink: {
      href: "/guides/budget-road-trip-quebec",
      label: "Préparer le budget de votre road trip",
    },
  },
  fuelStops: {
    title: "Anticipez les arrêts de ravitaillement",
    lead: "Au-delà du coût total, Sebavia aide à réfléchir à l’autonomie du véhicule, à la distance et aux arrêts possibles.",
    items: [
      "Autonomie liée au réservoir et à la consommation",
      "Achats nécessaires selon le trajet",
      "Suggestions d’arrêts à confirmer pendant le voyage",
    ],
    note: "Les stations peuvent être fermées et les prix varient. Conservez une marge raisonnable et vérifiez le niveau réel de carburant : l’estimation ne remplace pas cette vérification.",
    stopsLink: {
      href: "/planifier-arrets-carburant",
      label: "Planifier les arrêts de carburant",
    },
  },
  weather: {
    title: "Consultez la météo du voyage",
    lead: "Les prévisions liées aux dates et lieux aident à préparer vêtements, pauses et activités — sans remplacer une source d’alerte officielle.",
    items: [
      "Prévisions autour des dates du voyage",
      "Distinction entre les lieux du parcours",
      "Aide pour ajuster rythme et activités extérieures",
    ],
    note: "Revérifiez les prévisions à l’approche du départ : elles évoluent.",
    weatherPageLink: {
      href: "/meteo-voyage",
      label: "Voir comment Sebavia présente les prévisions du voyage",
    },
  },
  group: {
    title: "Adaptez le voyage à votre groupe",
    lead: "Un même itinéraire peut s’organiser autrement selon qui voyage.",
    items: [
      "Nombre d’adultes et d’enfants",
      "Solo, couple ou famille",
      "Intérêts et type de sortie",
      "Durée maximale et besoin d’hébergement",
      "Véhicule utilisé pour les calculs",
    ],
    examples: [
      "Plus de pauses avec de jeunes enfants",
      "Activités adaptées au profil du groupe",
      "Rythme différent pour une escapade en couple",
      "Plusieurs étapes pour un trajet plus long",
    ],
    familyGuideLink: {
      href: "/guides/road-trip-famille-quebec",
      label: "Consulter le guide pour un road trip en famille",
    },
    coupleGuideLink: {
      href: "/guides/road-trip-couple-quebec",
      label: "Consulter le guide pour une escapade en couple",
    },
  },
  method: {
    title: "Planifier un road trip au Québec en cinq étapes",
    steps: [
      {
        title: "Définir le cadre",
        body: "Point de départ, dates, durée, type de voyage et personnes — saisis manuellement ou en conversation.",
      },
      {
        title: "Choisir ou trouver une destination",
        body: "Destination déjà connue, ou critères (durée maximale, intérêts) pour orienter une suggestion.",
      },
      {
        title: "Construire le parcours",
        body: "Route, étapes, pauses et heure de départ, avec distance et durée estimées sur la carte.",
      },
      {
        title: "Ajouter activités et hébergement",
        body: "Visites, repas et nuitée proposée, en tenant compte du temps nécessaire.",
      },
      {
        title: "Vérifier météo et carburant",
        body: "Prévisions, estimation selon le véhicule, arrêts possibles, puis dernières vérifications avant le départ.",
      },
    ],
  },
  exampleTrip: {
    label: "Exemple de planification",
    disclaimer:
      "Scénario illustratif générique — aucun commerce, prix ou horaire n’est présenté comme confirmé.",
    title: "Escapade de trois jours",
    body: "Départ d’une ville québécoise vers une région choisie selon vos intérêts, avec une durée de route adaptée, une pause, une activité, un repas, un hébergement proposé, la météo autour des dates et une estimation du carburant.",
    items: [
      "Départ et région d’arrivée (génériques)",
      "Durée de route approximative selon vos contraintes",
      "Pause, activité et repas",
      "Hébergement proposé à confirmer",
      "Météo et carburant estimés",
    ],
  },
  regions: {
    title: "Des voyages possibles dans plusieurs régions",
    lead: "Que vous songiez à la Gaspésie, Charlevoix, la Côte-Nord, les Laurentides, les Cantons-de-l’Est, la Mauricie, l’Outaouais ou le Bas-Saint-Laurent, Sebavia aide à structurer le parcours — sans remplacer un guide régional dédié.",
    names: [
      "Gaspésie",
      "Charlevoix",
      "Côte-Nord",
      "Laurentides",
      "Cantons-de-l’Est",
      "Mauricie",
      "Outaouais",
      "Bas-Saint-Laurent",
    ],
  },
  comparison: {
    title: "Sebavia ou un simple calculateur de trajet",
    calculator: {
      title: "Calculateur de trajet",
      items: [
        "Une route entre deux points",
        "Une distance",
        "Une durée approximative",
      ],
    },
    sebavia: {
      title: "Sebavia",
      items: [
        "Destination et étapes",
        "Activités, repas et hébergement proposé",
        "Météo et véhicule",
        "Estimation du carburant",
        "Ajustements en conversation",
      ],
    },
    note: "Sebavia prépare le voyage ; ce n’est pas un système GPS de navigation en direct.",
    featuresLink: {
      href: "/fonctionnalites",
      label: "Voir toutes les fonctionnalités",
    },
  },
  assistant: {
    title: "Planifier aussi en conversation",
    lead: "Décrivez votre durée maximale, vos intérêts, votre destination ou votre besoin d’hébergement : l’assistant vous aide à démarrer, puis vous affinez le voyage.",
    link: {
      href: "/assistant-voyage-ia",
      label: "Voir comment l’assistant voyage IA fonctionne",
    },
  },
  checklist: {
    title: "Liste de vérification avant le départ",
    items: [
      "Confirmer les heures d’ouverture des activités",
      "Confirmer l’hébergement",
      "Vérifier la météo",
      "Vérifier les conditions routières officielles",
      "Vérifier le niveau de carburant",
      "Confirmer les activités saisonnières",
      "Prévoir une marge pour les pauses",
      "Consulter le voyage enregistré dans Sebavia",
    ],
    guideLink: {
      href: "/guides/checklist-road-trip-quebec",
      label: "Checklist complète : préparer un road trip au Québec",
    },
  },
  useCases: [
    {
      title: "Escapade de fin de semaine",
      body: "Durée maximale, une région, activités, repas et nuitée — pour structurer deux ou trois jours hors de chez vous.",
    },
    {
      title: "Road trip familial",
      body: "Pauses plus fréquentes, activités adaptées, rythme souple, carburant et météo regroupés dans le même parcours.",
    },
    {
      title: "Circuit de plusieurs jours",
      body: "Plusieurs étapes, hébergements proposés, temps de conduite, activités et ravitaillements à anticiper.",
    },
    {
      title: "Voyage spontané",
      body: "Destination encore ouverte : intérêts, rayon de déplacement et conversation pour construire une première proposition.",
    },
  ],
  plans: {
    title: "Quel forfait pour planifier votre voyage?",
    lead: "Certaines fonctions (accès complet au voyage, assistant, voix) dépendent du forfait. La page Tarifs demeure la source officielle des inclusions et des prix.",
    items: [
      {
        name: "Découverte",
        body: "Aperçu limité pour explorer la plateforme avant de prendre la route.",
      },
      {
        name: "Pass 30 jours",
        body: "Accès complet pendant 30 jours, sans renouvellement automatique — idéal pour préparer un voyage.",
      },
      {
        name: "Sebavia Plus",
        body: "Abonnement annuel avec les fonctions incluses selon le catalogue actif.",
      },
    ],
    cta: { href: "/pricing", label: "Comparer les forfaits" },
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Comment planifier un road trip au Québec avec Sebavia?",
        a: "Définissez le cadre (départ, dates, personnes), construisez le parcours avec étapes et activités, puis vérifiez météo et estimation du carburant. Vous pouvez commencer manuellement ou en conversation.",
      },
      {
        q: "Puis-je utiliser Sebavia si je ne connais pas encore ma destination?",
        a: "Oui. Indiquez une durée maximale, vos intérêts et votre point de départ : Sebavia peut vous aider à structurer ou suggérer un voyage selon ces critères.",
      },
      {
        q: "Puis-je limiter le nombre d’heures de conduite?",
        a: "Oui. Vous pouvez imposer une durée ou une distance maximale pour orienter l’itinéraire et les suggestions.",
      },
      {
        q: "Sebavia peut-il ajouter plusieurs étapes?",
        a: "Oui. Vous pouvez ajouter des étapes, des pauses et des activités, puis laisser le parcours se recalculer.",
      },
      {
        q: "Puis-je ajouter des activités et un hébergement?",
        a: "Oui, selon votre forfait. Les suggestions d’activités, restaurants et hébergements doivent être confirmées : Sebavia ne réserve pas à votre place.",
      },
      {
        q: "Comment le coût du carburant est-il estimé?",
        a: "À partir du véhicule, de la consommation, du réservoir et de la distance du parcours (aller ou aller-retour). Les prix varient : ce n’est pas une garantie.",
      },
      {
        q: "Les arrêts de ravitaillement sont-ils garantis?",
        a: "Non. Ce sont des suggestions à confirmer. Conservez une marge et vérifiez le niveau réel de carburant.",
      },
      {
        q: "Quel forfait utiliser pour un voyage de plusieurs jours?",
        a: "Le Pass 30 jours ou Sebavia Plus offrent l’accès complet au voyage et à l’assistant. Découverte reste un aperçu limité. Les détails sont sur la page Tarifs.",
      },
    ],
    moreHref: "/faq",
    moreLabel: "Voir la FAQ générale",
  },
  finalCta: {
    title: "Préparez votre prochain road trip au Québec",
    body: "Commencez avec une destination, une durée maximale ou une simple idée — puis affinez étapes, activités, météo et carburant.",
    primary: { href: "/register", label: "Planifier mon voyage" },
    secondary: { href: "/pricing", label: "Comparer les forfaits" },
    assistantLink: {
      href: "/assistant-voyage-ia",
      label: "Essayer l’assistant voyage IA",
    },
  },
} as const;
