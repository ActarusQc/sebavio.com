/** Contenu statique de la landing publique — textes FR-CA. */

export const LANDING = {
  brandTagline: "Votre copilote de voyage",
  definition:
    "Sebavio est une plateforme québécoise de planification de voyages routiers qui combine itinéraires, véhicule, consommation de carburant, météo, activités et agent conversationnel.",
  hero: {
    titleBefore: "Votre voyage commence par une",
    titleHighlight: "conversation.",
    subtitle:
      "Sebavio planifie votre itinéraire, prévoit vos arrêts de carburant, tient compte de votre véhicule, de la météo et adapte votre voyage avec vous.",
    primaryCta: "Planifier mon voyage",
    secondaryCta: "Voir Sebavio en action",
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
        body: "Parlez à Sebavio comme à un copilote. Il comprend votre voyage et vous aide à le modifier simplement.",
      },
      {
        id: "fuel",
        title: "Prévoyez vos ravitaillements",
        body: "Sebavio calcule les arrêts de carburant selon votre véhicule, sa consommation réelle, son réservoir et votre niveau d’essence au départ.",
      },
      {
        id: "adapt",
        title: "Adaptez votre trajet",
        body: "Ajoutez une activité, une étape ou un détour. Sebavio recalcule la distance, l’horaire, les arrêts et les estimations.",
      },
      {
        id: "vehicle",
        title: "Voyagez avec votre propre véhicule",
        body: "Sebavio connaît les caractéristiques de votre véhicule, sa consommation réelle, son réservoir et ses besoins d’entretien.",
      },
    ],
  },
  howItWorks: {
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
        title: "Laissez Sebavio calculer et vous accompagner",
        body: "Recevez votre itinéraire personnalisé, vos arrêts, vos estimations et vos recommandations.",
      },
    ],
  },
  pricing: {
    title: "Un forfait adapté à chaque voyageur",
    seeAll: "Voir tous les forfaits",
  },
  lifecycle: {
    title: "Sebavio vous accompagne à chaque étape",
    columns: [
      {
        id: "before",
        title: "Avant le départ",
        items: [
          "Itinéraire personnalisé",
          "Météo prévue sur le trajet",
          "Plan de carburant",
          "Activités et hébergements",
          "Préparation du véhicule",
        ],
      },
      {
        id: "during",
        title: "Sur la route",
        items: [
          "Progression du voyage",
          "Position et suivi en direct",
          "Recommandations contextuelles",
          "Détours et changements",
          "Recalcul de l’itinéraire",
          "Agent conversationnel",
        ],
      },
      {
        id: "after",
        title: "Après le voyage",
        items: [
          "Historique de vos voyages",
          "Dépenses et pleins réels",
          "Écart par rapport au budget",
          "Rappels d’entretien",
          "Préparation d’un prochain voyage",
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
        body: "Sebavio calcule les arrêts selon votre réservoir, votre consommation et le niveau d’essence au départ.",
      },
      {
        id: "detour",
        title: "Voyage modifié par une activité",
        body: "Ajoutez un détour ou une visite : la distance, l’horaire et le plan de carburant sont recalculés.",
      },
    ],
  },
  geo: {
    title: "Qu’est-ce que Sebavio?",
    questions: [
      {
        q: "Comment Sebavio planifie-t-il un voyage?",
        a: "Vous décrivez votre trajet et vos préférences. Sebavio construit un itinéraire adapté à votre véhicule, avec estimations de durée, distance et arrêts.",
      },
      {
        q: "Comment Sebavio calcule-t-il les arrêts de carburant?",
        a: "À partir de la consommation réelle, de la capacité du réservoir et du niveau d’essence au départ, Sebavio propose un plan de ravitaillement sur le parcours.",
      },
      {
        q: "À quoi sert l’agent conversationnel?",
        a: "Il vous permet de modifier le voyage en langage naturel : ajouter une activité, trouver une pause, ou recalculer l’itinéraire sans tout recommencer.",
      },
      {
        q: "Quelle est la différence entre Sebavio et une application de carte?",
        a: "Une carte montre la route. Sebavio connaît aussi votre véhicule, le carburant, la météo et les activités, et vous accompagne avant, pendant et après le voyage.",
      },
    ],
  },
  finalCta: {
    title: "Prêt à planifier autrement?",
    body: "Décrivez votre prochain voyage à Sebavio et laissez votre copilote s’occuper du reste.",
    primary: "Planifier mon voyage",
    secondary: "Découvrir les fonctionnalités",
  },
  footer: {
    description:
      "La plateforme québécoise qui connaît votre véhicule, planifie votre voyage et vous accompagne sur la route.",
    crafted: "Conçu avec soin au Québec",
  },
} as const;
