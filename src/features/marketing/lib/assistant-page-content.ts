/**
 * Contenu public de /assistant-voyage-ia — capacités confirmées uniquement.
 */

export const ASSISTANT_PAGE = {
  meta: {
    title: "Assistant voyage IA | Planifiez votre road trip avec Sebavia",
    description:
      "Planifiez votre voyage en conversation avec Sebavia : destination, itinéraire, activités, météo, hébergement et estimation du carburant.",
  },
  hero: {
    eyebrow: "Assistant voyage IA",
    title: "Assistant voyage IA : planifiez votre route en conversation",
    body: "Décrivez votre projet avec vos propres mots. Sebavia vous aide à le transformer en voyage organisé — itinéraire, activités, arrêts, météo et estimation du carburant — selon vos préférences.",
    primaryCta: { href: "/register", label: "Essayer l’assistant Sebavia" },
    secondaryCta: {
      href: "/fonctionnalites",
      label: "Voir toutes les fonctionnalités",
    },
    pricingLink: { href: "/pricing", label: "Voir les forfaits" },
  },
  demo: {
    label: "Exemple de conversation",
    disclaimer:
      "Démonstration illustrative : les destinations et lieux ne sont pas des disponibilités confirmées.",
    turns: [
      {
        role: "user" as const,
        text: "Je cherche une escapade en couple cette fin de semaine, à moins de trois heures de route.",
      },
      {
        role: "assistant" as const,
        text: "Parfait. D’où partez-vous, et préférez-vous plutôt nature, gastronomie ou une ambiance détente?",
      },
      {
        role: "user" as const,
        text: "On part de Québec. On aime la nature et un bon restaurant, avec un hébergement pour une nuit.",
      },
      {
        role: "assistant" as const,
        text: "Je peux préparer une proposition avec une destination dans votre rayon, une ou deux activités, un arrêt repas, un hébergement suggéré, la durée estimée, la météo autour des dates et une estimation du carburant selon votre véhicule.",
      },
    ],
    resultItems: [
      "Destination adaptée à la durée maximale",
      "Activités et arrêt repas",
      "Hébergement proposé (sans réservation)",
      "Durée estimée, météo et carburant",
    ],
  },
  natural: {
    title: "Parlez naturellement",
    lead: "Pas besoin de remplir tout de suite un long formulaire technique. Commencez par une idée, puis précisez au fil de la conversation.",
    examples: [
      "Je veux une sortie familiale à moins de deux heures.",
      "Trouve une destination pour une fin de semaine gastronomique.",
      "Ajoute une activité nature à notre trajet.",
      "Trouve un restaurant pour dîner vers midi.",
      "Ajoute un hébergement près de notre dernière activité.",
      "Nous voulons partir plus tard.",
      "Recalcule le carburant avec cette nouvelle étape.",
    ],
  },
  process: {
    title: "De l’idée au voyage organisé",
    steps: [
      {
        title: "Décrivez votre envie",
        body: "Type de sortie, destination ou simple idée, durée souhaitée, dates et personnes qui voyagent.",
      },
      {
        title: "Sebavia précise le besoin",
        body: "Questions utiles sur le point de départ, les intérêts, le temps de conduite, les activités, les repas ou l’hébergement.",
      },
      {
        title: "Le voyage prend forme",
        body: "Destination, itinéraire, activités, arrêts, météo et estimation du carburant se regroupent dans une proposition.",
      },
      {
        title: "Vous ajustez",
        body: "Ajoutez une activité, changez l’heure de départ, placez un repas, proposez un hébergement ou recalculez le carburant. Certaines modifications peuvent nécessiter une confirmation.",
      },
    ],
  },
  capabilities: {
    title: "Ce que l’assistant peut préparer",
    cards: [
      {
        title: "Destination et type de voyage",
        items: [
          "Destination déjà connue ou suggestion selon vos contraintes",
          "Durée ou distance maximale de route",
          "Sortie solo, couple, familiale ou escapade",
        ],
      },
      {
        title: "Itinéraire",
        items: [
          "Point de départ et destination",
          "Étapes et pauses",
          "Heure de départ et durée estimée",
        ],
      },
      {
        title: "Activités et découvertes",
        items: [
          "Suggestions selon vos intérêts",
          "Restaurants et arrêts utiles",
          "Ajout au voyage avec impact sur le parcours",
        ],
      },
      {
        title: "Hébergement",
        items: [
          "Proposition d’un lieu où dormir dans la planification",
          "Intégration au parcours proposé",
          "Disponibilités à confirmer — aucune réservation directe",
        ],
      },
      {
        title: "Météo",
        items: [
          "Prévisions liées aux dates et lieux du voyage",
          "Aide pour savoir quoi prévoir",
          "Les prévisions peuvent évoluer",
        ],
      },
      {
        title: "Carburant",
        items: [
          "Prise en compte du véhicule",
          "Consommation et coût estimés",
          "Recalcul lorsque le trajet change",
        ],
      },
    ],
  },
  evolve: {
    title: "Un voyage qui peut évoluer",
    lead: "La conversation ne sert pas seulement à créer un premier résultat. Vous pouvez continuer à ajuster votre programme.",
    items: [
      "Modifier la durée maximale ou préciser une destination",
      "ajouter une activité ou un arrêt repas",
      "changer l’heure de départ",
      "proposer un hébergement",
      "recalculer l’itinéraire et le carburant après un changement",
    ],
    note: "Certaines demandes sont appliquées après confirmation. Les résultats restent des propositions à vérifier.",
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Découvrez comment organiser un road trip complet au Québec",
    },
    fuelCostLink: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Comprendre l’estimation du coût de carburant",
    },
  },
  voice: {
    title: "Parler à Sebavia",
    lead: "Sur les forfaits qui l’incluent, vous pouvez dicter votre demande à voix haute. Sebavia transforme la parole en texte et peut aussi vous répondre à voix haute — pratique sur mobile.",
    items: [
      "Demande vocale convertie en conversation",
      "Réponse vocale possible",
      "Incluse dans le Pass 30 jours et Sebavia Plus",
    ],
    safety:
      "Configurez ou modifiez votre voyage lorsque le véhicule est stationné, ou demandez à un passager de le faire.",
  },
  personalization: {
    title: "Des résultats selon ce que vous précisez",
    lead: "Plus vous donnez de contexte utile, plus les propositions s’approchent de ce que vous cherchez. Sebavia n’invente pas automatiquement toutes vos préférences.",
    items: [
      "Nombre d’adultes et d’enfants",
      "Type de sortie et intérêts",
      "Durée maximale, destination et dates",
      "Véhicule et heure de départ",
      "Besoin éventuel d’un hébergement",
    ],
  },
  reliability: {
    title: "Vérifiez avant de partir",
    lead: "Certaines informations peuvent changer : horaires, prix, disponibilités, météo, état des routes, fermetures ou activités saisonnières.",
    body: "Confirmez les renseignements importants auprès des établissements, des services routiers officiels et des sources météo appropriées.",
    links: [
      { href: "/conditions-utilisation", label: "Conditions d’utilisation" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  privacy: {
    title: "Vos conversations et vos données",
    lead: "Vos demandes servent à produire les réponses et à organiser le voyage. Évitez de transmettre des renseignements sensibles inutiles (mots de passe, numéros de carte, documents confidentiels).",
    body: "Certaines informations nécessaires peuvent être traitées par des fournisseurs technologiques. Les détails sont dans la politique de confidentialité.",
    link: { href: "/confidentialite", label: "Politique de confidentialité" },
  },
  useCases: [
    {
      title: "Escapade de fin de semaine",
      body: "Indiquez un temps de route maximal, vos intérêts et si vous voulez un hébergement : Sebavia aide à structurer destination, activité, repas et météo.",
    },
    {
      title: "Sortie familiale",
      body: "Précisez le nombre d’enfants et le rythme souhaité pour orienter pauses, activités adaptées, heure de départ et estimation du carburant.",
    },
    {
      title: "Voyage gastronomique",
      body: "Orientez la conversation vers restaurants et découvertes complémentaires, avec un hébergement proposé si vous restez la nuit.",
    },
    {
      title: "Long voyage routier",
      body: "Organisez plusieurs étapes, pauses et recalculs de carburant, avec la météo pour mieux préparer les journées.",
    },
  ],
  plans: {
    title: "Quel forfait pour l’assistant?",
    lead: "L’accès complet à l’assistant conversationnel dépend du forfait.",
    items: [
      {
        name: "Découverte",
        body: "Accès limité à l’agent pour explorer Sebavia avant de prendre la route.",
      },
      {
        name: "Pass 30 jours",
        body: "Assistant conversationnel texte et voix pendant 30 jours, sans renouvellement automatique.",
      },
      {
        name: "Sebavia Plus",
        body: "Assistant conversationnel texte et voix pendant la période de l’abonnement annuel.",
      },
    ],
    note: "Les capacités, limites et périodes d’accès sont détaillées sur la page Tarifs.",
    cta: { href: "/pricing", label: "Comparer les forfaits" },
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Qu’est-ce qu’un assistant voyage IA?",
        a: "C’est un copilote conversationnel qui vous aide à préparer un voyage routier en langage naturel : destination, itinéraire, activités, arrêts, météo et estimation du carburant.",
      },
      {
        q: "Puis-je utiliser Sebavia sans connaître ma destination?",
        a: "Oui. Vous pouvez décrire une envie, une durée maximale et vos intérêts : Sebavia peut proposer des destinations adaptées à ces contraintes.",
      },
      {
        q: "Puis-je imposer une durée maximale de route?",
        a: "Oui. Vous pouvez indiquer une durée ou une distance maximale pour l’aller, afin d’orienter les suggestions.",
      },
      {
        q: "L’assistant peut-il ajouter des activités et un hébergement?",
        a: "Il peut proposer des activités, des restaurants et un hébergement dans la planification. Sebavia ne réserve pas à votre place : confirmez toujours disponibilités et horaires.",
      },
      {
        q: "Puis-je modifier un voyage après sa création?",
        a: "Oui. Vous pouvez demander d’ajouter une activité, un repas, de changer l’heure de départ ou de recalculer le carburant. Certaines actions demandent une confirmation.",
      },
      {
        q: "Peut-on parler à Sebavia à la voix?",
        a: "Oui, sur les forfaits qui incluent la voix (Pass 30 jours et Sebavia Plus). Configurez votre voyage à l’arrêt ou laissez un passager le faire.",
      },
      {
        q: "Les suggestions sont-elles garanties?",
        a: "Non. Ce sont des propositions d’aide à la planification. Horaires, prix, météo et disponibilités peuvent changer : vérifiez avant de partir.",
      },
      {
        q: "Quel forfait comprend l’assistant complet?",
        a: "Le Pass 30 jours et Sebavia Plus incluent l’assistant texte et voix. Découverte offre un accès limité pour découvrir la plateforme.",
      },
    ],
    moreHref: "/faq",
    moreLabel: "Voir la FAQ générale",
  },
  finalCta: {
    title: "Décrivez votre prochain voyage à Sebavia",
    body: "Que vous ayez déjà une destination ou seulement une idée, commencez par une conversation et affinez ensuite.",
    primary: { href: "/register", label: "Créer mon compte" },
    secondary: { href: "/pricing", label: "Comparer les forfaits" },
    featuresLink: {
      href: "/fonctionnalites",
      label: "Toutes les fonctionnalités",
    },
  },
  differentiation: {
    title: "Plus qu’un calculateur de trajet",
    lead: "Un calculateur de trajet répond surtout à « Comment me rendre à destination? ». Sebavia aide aussi à préparer l’ensemble du voyage.",
    items: [
      "Où pourrais-je aller?",
      "Que pourrais-je faire?",
      "Combien de temps ai-je envie de conduire?",
      "Où arrêter pour dîner ou dormir?",
      "Quel sera le coût approximatif du carburant?",
      "Quelle météo est prévue?",
      "Comment ajuster mon programme?",
    ],
  },
} as const;
