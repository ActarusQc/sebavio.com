/** Contenu statique de la landing publique — textes FR-CA. */

export const LANDING = {
  brandTagline: "Votre copilote de voyage",
  definition:
    "Sebavia est une plateforme québécoise de planification de voyages routiers qui combine itinéraires, véhicule, consommation de carburant, météo, activités et agent conversationnel.",
  hero: {
    titleBefore: "Votre voyage commence par une",
    titleHighlight: "conversation.",
    subtitle:
      "Sebavia planifie votre itinéraire, prévoit vos arrêts de carburant, tient compte de votre véhicule, de la météo et adapte votre voyage avec vous.",
    primaryCta: "Planifier mon voyage",
    secondaryCta: "Voir Sebavia en action",
    benefits: [
      {
        id: "agent",
        label: "Agent conversationnel intelligent",
        icon: "MessageSquare",
      },
      {
        id: "fuel",
        label: "Plan de ravitaillement adapté à votre véhicule",
        icon: "Fuel",
      },
      {
        id: "route",
        label: "Itinéraire flexible avec activités et détours",
        icon: "Route",
      },
      {
        id: "lifecycle",
        label: "Accompagnement avant, pendant et après le voyage",
        icon: "MapPinCheck",
      },
    ],
    trust: ["Conçu au Québec", "Données sécurisées", "Support humain"],
  },
  tripDemo: {
    title: "Mon voyage en Gaspésie",
    from: "Montréal",
    to: "Percé",
    duration: "7 h 24",
    distance: "742 km",
    steps: "5 étapes",
    nextStop: {
      name: "Rocher Percé",
      detail: "Point d’intérêt · Vue sur le golfe",
      detour: "Sur votre trajet",
    },
    fuelStops: "3 arrêts prévus",
    estimatedCost: "168,45 $",
    weather: "18 °C · Nuageux",
    weatherPlace: "Météo à Percé",
  },
  conversationDemo: {
    userMessage:
      "Nous partons de Montréal pour Percé avec deux enfants. Trouve-nous un endroit familial pour dîner après environ six heures de route.",
    assistantMessage:
      "Voici une suggestion située sur votre trajet, sans vous faire revenir en arrière.",
    suggestion: {
      name: "Pause familiale sur le parcours",
      region: "Exemple de démonstration · Bas-Saint-Laurent",
      detour: "Sur votre trajet",
      description:
        "Suggestion générique pour illustrer l’agent — un lieu familial près de l’itinéraire, sans détour important.",
    },
    inputPlaceholder: "Écrivez votre message…",
  },
  features: {
    title: "Bien plus qu’un itinéraire sur une carte",
    items: [
      {
        id: "chat",
        title: "Discutez avec votre copilote",
        body: "Parlez à Sebavia comme à un copilote. Il comprend votre voyage et vous aide à le modifier simplement.",
      },
      {
        id: "fuel",
        title: "Prévoyez vos ravitaillements",
        body: "Sebavia calcule vos arrêts de carburant selon votre véhicule, sa consommation réelle, son réservoir et votre niveau d’essence au départ.",
      },
      {
        id: "adapt",
        title: "Adaptez votre trajet à mesure que vous roulez",
        body: "Ajoutez une activité, une étape ou un détour. Sebavia recalcule la distance, l’horaire, les arrêts et les estimations.",
      },
      {
        id: "vehicle",
        title: "Voyagez avec votre propre véhicule",
        body: "Sebavia connaît les caractéristiques de votre véhicule, sa consommation réelle, son réservoir et ses besoins d’entretien.",
      },
    ],
  },
  howItWorks: {
    eyebrow: "Trois étapes simples",
    title: "Planifiez votre voyage en quelques minutes",
    steps: [
      {
        n: 1,
        title: "Ajoutez votre véhicule",
        body: "Indiquez votre véhicule et ajustez sa consommation réelle au besoin.",
      },
      {
        n: 2,
        title: "Décrivez votre voyage",
        body: "Indiquez votre destination, vos préférences, vos activités et votre façon de voyager.",
      },
      {
        n: 3,
        title: "Laissez Sebavia calculer et vous accompagner",
        body: "Recevez votre itinéraire personnalisé, vos arrêts, vos estimations et vos recommandations.",
      },
    ],
  },
  pricing: {
    title: "Un forfait adapté à chaque voyageur",
    seeAll: "Voir tous les forfaits",
  },
  lifecycle: {
    title: "Sebavia vous accompagne à chaque étape",
    columns: [
      {
        id: "before",
        title: "Avant le départ",
        items: [
          "Itinéraire personnalisé",
          "Météo prévue tout au long du trajet",
          "Plan de carburant détaillé",
          "Activités et hébergements",
          "Entretien du véhicule",
        ],
      },
      {
        id: "during",
        title: "Sur la route",
        items: [
          "Position et suivi du voyage",
          "Recommandations contextuelles",
          "Détours et changements",
          "Recalcul automatique",
          "Assistant conversationnel",
        ],
      },
      {
        id: "after",
        title: "Après le voyage",
        items: [
          "Historique de vos voyages",
          "Dépenses réelles",
          "Bilan du carburant",
          "Rappels d’entretien",
          "Préparation du prochain voyage",
        ],
      },
    ],
  },
  useCases: {
    title: "Conçu pour les vrais voyages routiers",
    cases: [
      {
        id: "family",
        title: "Voyage familial avec plusieurs pauses",
        body: "Planifiez des arrêts repas et des activités adaptées aux enfants, puis ajustez l’itinéraire en conversation.",
      },
      {
        id: "long",
        title: "Long trajet avec ravitaillements",
        body: "Sebavia calcule les arrêts selon votre réservoir, votre consommation et le niveau d’essence au départ.",
      },
      {
        id: "detour",
        title: "Voyage modifié par une activité",
        body: "Ajoutez un détour ou une visite : la distance, l’horaire et le plan de carburant sont recalculés.",
      },
    ],
  },
  nameMeaning: {
    title: "Pourquoi le nom Sebavia?",
    intro:
      "Le nom Sebavia unit deux symboles au cœur de notre vision : l’étoile et la route.",
    seba: {
      word: "Seba",
      label: "L’étoile qui guide",
      body: "« Seba » évoque l’étoile, ce repère qui guide les voyageurs depuis toujours.",
    },
    via: {
      word: "Via",
      label: "La route à parcourir",
      body: "« Via » signifie la route, le chemin qui mène vers une destination, une découverte ou une nouvelle aventure.",
    },
    result: {
      word: "Sebavia",
      label: "L’étoile qui guide votre route",
      body: "Sebavia représente ainsi l’étoile qui guide votre route. Une plateforme pensée pour vous accompagner dans la préparation de vos voyages, vous aider à prendre de meilleures décisions et simplifier chaque étape du trajet.",
    },
  },
  geo: {
    title: "Qu’est-ce que Sebavia?",
    questions: [
      {
        q: "Comment Sebavia planifie-t-il un voyage?",
        a: "Vous décrivez votre trajet et vos préférences. Sebavia construit un itinéraire adapté à votre véhicule, avec estimations de durée, distance et arrêts. Pour une méthode complète de préparation d’un voyage routier au Québec, consultez le planificateur de road trip.",
      },
      {
        q: "Comment Sebavia calcule-t-il les arrêts de carburant?",
        a: "À partir de la consommation réelle, de la capacité du réservoir et du niveau d’essence au départ, Sebavia propose un plan de ravitaillement sur le parcours. Pour l’autonomie et les arrêts, consultez la page Planifier les arrêts de carburant; pour le budget essence, le calculateur de coût de carburant.",
      },
      {
        q: "À quoi sert l’agent conversationnel?",
        a: "Il vous permet de modifier le voyage en langage naturel : ajouter une activité, trouver une pause, ou recalculer l’itinéraire sans tout recommencer.",
      },
      {
        q: "Quelle est la différence entre Sebavia et une application de carte?",
        a: "Une carte montre la route. Sebavia connaît aussi votre véhicule, le carburant, la météo et les activités, et vous accompagne avant, pendant et après le voyage.",
      },
    ],
  },
  finalCta: {
    title: "Prêt à planifier autrement?",
    body: "Décrivez votre prochain voyage à Sebavia et laissez votre copilote s’occuper du reste.",
    primary: "Planifier mon voyage",
    secondary: "Découvrir les fonctionnalités",
  },
  footer: {
    description:
      "La plateforme québécoise qui connaît votre véhicule, planifie votre voyage et vous accompagne sur la route.",
    crafted: "Conçu avec soin au Québec",
  },
} as const;
